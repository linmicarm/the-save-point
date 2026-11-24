const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

const includeResolutions = {
  resolutions: { orderBy: { position: 'asc' } },
}

// GET /api/year — all year entries for current user
router.get('/', requireAuth, async (req, res) => {
  const entries = await prisma.yearEntry.findMany({
    where: { userId: req.userId },
    orderBy: { year: 'desc' },
    include: includeResolutions,
  })
  res.json({ entries })
})

// GET /api/year/:year
router.get('/:year', requireAuth, async (req, res) => {
  const entry = await prisma.yearEntry.findUnique({
    where: { userId_year: { userId: req.userId, year: Number(req.params.year) } },
    include: includeResolutions,
  })
  res.json({ entry })
})

// POST /api/year — create a year entry
router.post('/', requireAuth, async (req, res) => {
  const { year, theme, quote } = req.body
  const y = Number(year)
  if (!y) return res.status(400).json({ error: 'Valid year is required.' })

  const existing = await prisma.yearEntry.findUnique({
    where: { userId_year: { userId: req.userId, year: y } },
  })
  if (existing) return res.status(409).json({ error: `You already have an entry for ${y}.` })

  const entry = await prisma.yearEntry.create({
    data: {
      userId: req.userId,
      year: y,
      theme: theme?.trim() || null,
      quote: quote?.trim() || null,
    },
    include: includeResolutions,
  })
  res.status(201).json({ entry })
})

// PATCH /api/year/:year — update theme or quote
router.patch('/:year', requireAuth, async (req, res) => {
  const { theme, quote } = req.body
  const entry = await prisma.yearEntry.update({
    where: { userId_year: { userId: req.userId, year: Number(req.params.year) } },
    data: {
      ...(theme !== undefined && { theme: theme?.trim() || null }),
      ...(quote !== undefined && { quote: quote?.trim() || null }),
    },
    include: includeResolutions,
  })
  res.json({ entry })
})

// POST /api/year/:year/resolutions — add a resolution
router.post('/:year/resolutions', requireAuth, async (req, res) => {
  const { title, why, notes } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })

  const entry = await prisma.yearEntry.findUnique({
    where: { userId_year: { userId: req.userId, year: Number(req.params.year) } },
  })
  if (!entry) return res.status(404).json({ error: 'Year entry not found.' })

  const last = await prisma.resolution.findFirst({
    where: { yearEntryId: entry.id },
    orderBy: { position: 'desc' },
  })

  const resolution = await prisma.resolution.create({
    data: {
      yearEntryId: entry.id,
      title: title.trim(),
      why: why?.trim() || null,
      notes: notes?.trim() || null,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      position: (last?.position ?? -1) + 1,
    },
  })
  res.status(201).json({ resolution })
})

// PATCH /api/year/resolutions/:id — update a resolution
router.patch('/resolutions/:id', requireAuth, async (req, res) => {
  const res_ = await prisma.resolution.findFirst({
    where: { id: req.params.id, yearEntry: { userId: req.userId } },
  })
  if (!res_) return res.status(404).json({ error: 'Resolution not found.' })

  const { title, why, notes, completed, tags } = req.body
  const updated = await prisma.resolution.update({
    where: { id: req.params.id },
    data: {
      ...(title     !== undefined && { title: title.trim() }),
      ...(why       !== undefined && { why: why?.trim() || null }),
      ...(notes     !== undefined && { notes: notes?.trim() || null }),
      ...(completed !== undefined && { completed }),
      ...(tags      !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    },
  })
  res.json({ resolution: updated })
})

// DELETE /api/year/resolutions/:id
router.delete('/resolutions/:id', requireAuth, async (req, res) => {
  const resolution = await prisma.resolution.findFirst({
    where: { id: req.params.id, yearEntry: { userId: req.userId } },
  })
  if (!resolution) return res.status(404).json({ error: 'Resolution not found.' })
  await prisma.resolution.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated.' })
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

module.exports = router
