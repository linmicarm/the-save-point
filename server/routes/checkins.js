const express = require('express')
const prisma = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

const WEATHER = ['sunny', 'cloudy', 'rainy', 'stormy']

// GET /api/checkins?limit=7 — your recent check-ins, newest first
router.get('/', requireAuth, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 7, 1), 90)
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json({ checkIns })
})

// POST /api/checkins — { weather, note? }
// Attaches the active season automatically, like journal entries do.
router.post('/', requireAuth, async (req, res) => {
  const { weather, note } = req.body
  if (!WEATHER.includes(weather)) {
    return res.status(400).json({ error: `Weather must be one of: ${WEATHER.join(', ')}.` })
  }

  const activeSeason = await prisma.season.findFirst({
    where: { userId: req.userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })

  const checkIn = await prisma.checkIn.create({
    data: {
      userId: req.userId,
      seasonId: activeSeason?.id || null,
      weather,
      note: note?.trim().slice(0, 280) || null,
    },
  })
  res.status(201).json({ checkIn })
})

// DELETE /api/checkins/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const existing = await prisma.checkIn.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) return res.status(404).json({ error: 'Check-in not found.' })
  await prisma.checkIn.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

module.exports = router
