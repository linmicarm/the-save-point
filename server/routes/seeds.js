const express = require('express')
const prisma = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

const MAX_ACTIVE_SEEDS = 5   // gentle cap — a season has a few small things, not a to-do list
const seedInclude = {
  _count: { select: { actions: true } },
  actions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
}

// flatten the include into { actionCount, lastTendedAt }
function shape(seed) {
  const { _count, actions, ...rest } = seed
  return { ...rest, actionCount: _count.actions, lastTendedAt: actions[0]?.createdAt ?? null }
}

async function activeSeasonId(userId) {
  const season = await prisma.season.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  })
  return season?.id ?? null
}

// GET /api/seeds — every seed in your current season (replanted ones too: they stay in the garden)
router.get('/', requireAuth, async (req, res) => {
  const seasonId = await activeSeasonId(req.userId)
  if (!seasonId) return res.json({ seeds: [] })
  const seeds = await prisma.seed.findMany({
    where: { userId: req.userId, seasonId },
    orderBy: { createdAt: 'asc' },
    include: seedInclude,
  })
  res.json({ seeds: seeds.map(shape) })
})

// POST /api/seeds — { title }
router.post('/', requireAuth, async (req, res) => {
  const title = req.body.title?.trim().slice(0, 120)
  if (!title) return res.status(400).json({ error: 'Give your seed a name.' })

  const seasonId = await activeSeasonId(req.userId)
  if (!seasonId) return res.status(400).json({ error: 'Begin a season first.' })

  const active = await prisma.seed.count({
    where: { userId: req.userId, seasonId, replantedAt: null },
  })
  if (active >= MAX_ACTIVE_SEEDS) {
    return res.status(400).json({ error: `Keep it small — ${MAX_ACTIVE_SEEDS} seeds at a time is plenty.` })
  }

  const seed = await prisma.seed.create({
    data: { userId: req.userId, seasonId, title },
    include: seedInclude,
  })
  res.status(201).json({ seed: shape(seed) })
})

// POST /api/seeds/:id/tend — { note? } — you did a little something for this seed
router.post('/:id/tend', requireAuth, async (req, res) => {
  const seed = await prisma.seed.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!seed) return res.status(404).json({ error: 'Seed not found.' })
  if (seed.replantedAt) return res.status(400).json({ error: 'This seed was replanted.' })

  await prisma.seedAction.create({
    data: { seedId: seed.id, userId: req.userId, note: req.body.note?.trim().slice(0, 280) || null },
  })
  const updated = await prisma.seed.findUnique({ where: { id: seed.id }, include: seedInclude })
  res.status(201).json({ seed: shape(updated) })
})

// POST /api/seeds/:id/replant — { title } — shrink a seed that feels too big into a smaller one.
// The old seed keeps everything it grew; nothing is lost or marked as failed.
router.post('/:id/replant', requireAuth, async (req, res) => {
  const title = req.body.title?.trim().slice(0, 120)
  if (!title) return res.status(400).json({ error: 'Name the smaller seed.' })

  const old = await prisma.seed.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!old) return res.status(404).json({ error: 'Seed not found.' })
  if (old.replantedAt) return res.status(400).json({ error: 'This seed was already replanted.' })

  const [, created] = await prisma.$transaction([
    prisma.seed.update({ where: { id: old.id }, data: { replantedAt: new Date() } }),
    prisma.seed.create({
      data: { userId: req.userId, seasonId: old.seasonId, title, replantedFromId: old.id },
      include: seedInclude,
    }),
  ])
  const oldFull = await prisma.seed.findUnique({ where: { id: old.id }, include: seedInclude })
  res.status(201).json({ seed: shape(created), replanted: shape(oldFull) })
})

// DELETE /api/seeds/:id — for mistakes
router.delete('/:id', requireAuth, async (req, res) => {
  const seed = await prisma.seed.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!seed) return res.status(404).json({ error: 'Seed not found.' })
  await prisma.seed.delete({ where: { id: seed.id } })
  res.json({ ok: true })
})

module.exports = router
