const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/traditions — all entries grouped by holiday
router.get('/', requireAuth, async (req, res) => {
  const entries = await prisma.holidayEntry.findMany({
    where: { userId: req.userId },
    orderBy: [{ holidayName: 'asc' }, { year: 'desc' }],
  })

  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.holidayName]) acc[entry.holidayName] = []
    acc[entry.holidayName].push(entry)
    return acc
  }, {})

  res.json({ grouped, entries })
})

// POST /api/traditions
router.post('/', requireAuth, async (req, res) => {
  const { holidayName, year, title, celebration, food, people, mood, photoUrl, changes } = req.body
  if (!holidayName?.trim()) return res.status(400).json({ error: 'Holiday name is required.' })
  if (!year) return res.status(400).json({ error: 'Year is required.' })

  const existing = await prisma.holidayEntry.findUnique({
    where: { userId_holidayName_year: { userId: req.userId, holidayName: holidayName.trim(), year: Number(year) } },
  })
  if (existing) return res.status(409).json({ error: `You already have a ${holidayName} entry for ${year}.` })

  const entry = await prisma.holidayEntry.create({
    data: {
      userId: req.userId,
      holidayName: holidayName.trim(),
      year: Number(year),
      title:       title?.trim()       || null,
      celebration: celebration?.trim() || null,
      food:        food?.trim()        || null,
      people:      people?.trim()      || null,
      mood:        mood?.trim()        || null,
      photoUrl:    photoUrl?.trim()    || null,
      changes:     changes?.trim()     || null,
    },
  })
  res.status(201).json({ entry })
})

// PATCH /api/traditions/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.holidayEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })

  const { title, celebration, food, people, mood, photoUrl, changes } = req.body
  const updated = await prisma.holidayEntry.update({
    where: { id: req.params.id },
    data: {
      ...(title       !== undefined && { title:       title?.trim()       || null }),
      ...(celebration !== undefined && { celebration: celebration?.trim() || null }),
      ...(food        !== undefined && { food:        food?.trim()        || null }),
      ...(people      !== undefined && { people:      people?.trim()      || null }),
      ...(mood        !== undefined && { mood:        mood?.trim()        || null }),
      ...(photoUrl    !== undefined && { photoUrl:    photoUrl?.trim()    || null }),
      ...(changes     !== undefined && { changes:     changes?.trim()     || null }),
    },
  })
  res.json({ entry: updated })
})

// DELETE /api/traditions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.holidayEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  await prisma.holidayEntry.delete({ where: { id: req.params.id } })
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
