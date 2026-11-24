const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/public/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const places = await prisma.place.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { createdAt: 'asc' },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ places })
})

router.get('/', requireAuth, async (req, res) => {
  const places = await prisma.place.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ places })
})

router.post('/', requireAuth, async (req, res) => {
  const { name, type, description, emoji, year, tags, photos, rating, isPublic, seasonId } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' })
  if (!['lived', 'visited', 'want'].includes(type)) return res.status(400).json({ error: 'Invalid type.' })
  if (rating != null && (Number(rating) < 1 || Number(rating) > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
  }
  const place = await prisma.place.create({
    data: {
      userId:      req.userId,
      name:        name.trim(),
      type,
      description: description?.trim() || null,
      emoji:       emoji || null,
      year:        year ? Number(year) : null,
      tags:        Array.isArray(tags) ? tags : [],
      photos:      Array.isArray(photos) ? photos : null,
      rating:      rating != null ? Number(rating) : null,
      isPublic:    Boolean(isPublic),
      seasonId:    seasonId || null,
    },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.status(201).json({ place })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const place = await prisma.place.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!place) return res.status(404).json({ error: 'Place not found.' })
  const { name, type, description, emoji, year, tags, photos, rating, isPublic, seasonId } = req.body
  if (rating != null && (Number(rating) < 1 || Number(rating) > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
  }
  const updated = await prisma.place.update({
    where: { id: req.params.id },
    data: {
      ...(name        !== undefined && { name:        name?.trim() || place.name }),
      ...(type        !== undefined && { type }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(emoji       !== undefined && { emoji:       emoji || null }),
      ...(year        !== undefined && { year:        year ? Number(year) : null }),
      ...(tags        !== undefined && { tags:        Array.isArray(tags) ? tags : [] }),
      ...(photos      !== undefined && { photos:      Array.isArray(photos) ? photos : null }),
      ...(rating      !== undefined && { rating:      rating != null ? Number(rating) : null }),
      ...(isPublic    !== undefined && { isPublic }),
      ...(seasonId    !== undefined && { seasonId:    seasonId || null }),
    },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ place: updated })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const place = await prisma.place.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!place) return res.status(404).json({ error: 'Place not found.' })
  await prisma.place.delete({ where: { id: req.params.id } })
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
