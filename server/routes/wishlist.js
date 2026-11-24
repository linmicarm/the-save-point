const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

const VALID_CATEGORIES = ['cook', 'eat', 'watch', 'read', 'play', 'visit', 'learn', 'buy']

// GET /api/wishlist
router.get('/', requireAuth, async (req, res) => {
  const items = await prisma.wishItem.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ items })
})

// POST /api/wishlist
router.post('/', requireAuth, async (req, res) => {
  const { category, title, notes, seasonId } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category.' })

  const item = await prisma.wishItem.create({
    data: {
      userId:   req.userId,
      category,
      title:    title.trim(),
      notes:    notes?.trim() || null,
      seasonId: seasonId || null,
    },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.status(201).json({ item })
})

// PATCH /api/wishlist/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const item = await prisma.wishItem.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!item) return res.status(404).json({ error: 'Item not found.' })

  const { title, notes, completed, seasonId } = req.body
  const updated = await prisma.wishItem.update({
    where: { id: req.params.id },
    data: {
      ...(title     !== undefined && { title:    title.trim() }),
      ...(notes     !== undefined && { notes:    notes?.trim() || null }),
      ...(completed !== undefined && { completed }),
      ...(seasonId  !== undefined && { seasonId: seasonId || null }),
    },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ item: updated })
})

// DELETE /api/wishlist/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const item = await prisma.wishItem.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!item) return res.status(404).json({ error: 'Item not found.' })
  await prisma.wishItem.delete({ where: { id: req.params.id } })
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
