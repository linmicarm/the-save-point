const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/seasons — current user's seasons
router.get('/', requireAuth, async (req, res) => {
  const seasons = await prisma.season.findMany({
    where: { userId: req.userId },
    orderBy: { startedAt: 'desc' },
  })
  res.json({ seasons })
})

// GET /api/seasons/active — active season for current user
router.get('/active', requireAuth, async (req, res) => {
  const season = await prisma.season.findFirst({
    where: { userId: req.userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  res.json({ season })
})

// GET /api/seasons/user/:username — public active season
router.get('/user/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const season = await prisma.season.findFirst({
    where: { userId: user.id, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  res.json({ season })
})

// GET /api/seasons/user/:username/all — all seasons for a public profile
router.get('/user/:username/all', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const seasons = await prisma.season.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: 'desc' },
  })
  res.json({ seasons })
})

// POST /api/seasons — start a new season
router.post('/', requireAuth, async (req, res) => {
  const { name, emoji, color, intention } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Season name is required.' })

  // close any existing active season
  await prisma.season.updateMany({
    where: { userId: req.userId, endedAt: null },
    data: { endedAt: new Date() },
  })

  const season = await prisma.season.create({
    data: {
      userId: req.userId,
      name: name.trim(),
      emoji: emoji || '✦',
      color: color || '#c4b5fd',
      intention: intention?.trim() || null,
    },
  })
  res.status(201).json({ season })
})

// PATCH /api/seasons/:id — update a season
router.patch('/:id', requireAuth, async (req, res) => {
  const { name, emoji, color, intention, reflection, coverUrl } = req.body
  const season = await prisma.season.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!season) return res.status(404).json({ error: 'Season not found.' })

  const updated = await prisma.season.update({
    where: { id: req.params.id },
    data: {
      ...(name       && { name: name.trim() }),
      ...(emoji      && { emoji }),
      ...(color      && { color }),
      ...(intention  !== undefined && { intention:  intention?.trim()  || null }),
      ...(reflection !== undefined && { reflection: reflection?.trim() || null }),
      ...(coverUrl   !== undefined && { coverUrl:   coverUrl?.trim()   || null }),
    },
  })
  res.json({ season: updated })
})

// POST /api/seasons/:id/close — close a season (the closing ceremony)
// Optional body: { reflection, carryForward, released }. Everything is saved in the
// same single update as endedAt, so a season can't end without its closing words
// (or the other way around). Sending no body still works.
router.post('/:id/close', requireAuth, async (req, res) => {
  const season = await prisma.season.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!season) return res.status(404).json({ error: 'Season not found.' })
  if (season.endedAt) return res.status(400).json({ error: 'This season has already ended.' })

  const { reflection, carryForward, released } = req.body ?? {}
  const clean = (v) => (typeof v === 'string' ? v.trim().slice(0, 2000) || null : undefined)

  const updated = await prisma.season.update({
    where: { id: req.params.id },
    data: {
      endedAt: new Date(),
      ...(clean(reflection)   !== undefined && { reflection:   clean(reflection) }),
      ...(clean(carryForward) !== undefined && { carryForward: clean(carryForward) }),
      ...(clean(released)     !== undefined && { released:     clean(released) }),
    },
  })
  res.json({ season: updated })
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
