const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/months — all entries for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  const entries = await prisma.monthEntry.findMany({
    where: { userId: req.userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  res.json({ entries })
})

// GET /api/months/public/:username — public entries for a profile
router.get('/public/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const entries = await prisma.monthEntry.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  res.json({ entries })
})

// POST /api/months
router.post('/', requireAuth, async (req, res) => {
  const { year, month } = req.body
  if (!year || !month) return res.status(400).json({ error: 'Year and month are required.' })

  const existing = await prisma.monthEntry.findUnique({
    where: { userId_year_month: { userId: req.userId, year: Number(year), month: Number(month) } },
  })
  if (existing) return res.status(409).json({ error: 'Entry for that month already exists.' })

  const entry = await prisma.monthEntry.create({
    data: { userId: req.userId, year: Number(year), month: Number(month) },
  })
  res.status(201).json({ entry })
})

// PATCH /api/months/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.monthEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })

  const { mood, theme, highlight, focus, foods, selfCare, activities, media, other, photoUrl, isPublic } = req.body
  const updated = await prisma.monthEntry.update({
    where: { id: req.params.id },
    data: {
      ...(mood       !== undefined && { mood:       mood?.trim()       || null }),
      ...(theme      !== undefined && { theme:      theme?.trim()      || null }),
      ...(highlight  !== undefined && { highlight:  highlight?.trim()  || null }),
      ...(focus      !== undefined && { focus:      focus?.trim()      || null }),
      ...(foods      !== undefined && { foods:      foods?.trim()      || null }),
      ...(selfCare   !== undefined && { selfCare:   selfCare?.trim()   || null }),
      ...(activities !== undefined && { activities: activities?.trim() || null }),
      ...(media      !== undefined && { media:      media?.trim()      || null }),
      ...(other      !== undefined && { other:      other?.trim()      || null }),
      ...(photoUrl   !== undefined && { photoUrl:   photoUrl?.trim()   || null }),
      ...(isPublic   !== undefined && { isPublic }),
    },
  })
  res.json({ entry: updated })
})

// DELETE /api/months/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.monthEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  await prisma.monthEntry.delete({ where: { id: req.params.id } })
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
