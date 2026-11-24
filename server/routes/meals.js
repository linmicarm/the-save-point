const express = require('express')
const jwt     = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

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

// normalise to start-of-day UTC Monday
function parseWeekStart(str) {
  const d = new Date(str)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ── GET /api/meals?weekStart=YYYY-MM-DD ───────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const weekStart = parseWeekStart(req.query.weekStart || new Date().toISOString())
  try {
    const [entries, shopItems] = await Promise.all([
      prisma.mealEntry.findMany({
        where: { userId: req.userId, weekStart },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.shopItem.findMany({
        where: { userId: req.userId, weekStart },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    res.json({ entries, shopItems })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/meals/entries ───────────────────────────────────────
router.post('/entries', requireAuth, async (req, res) => {
  const { weekStart, day, mealType, name, notes, rating, tags } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required.' })
  if (day === undefined || !mealType) return res.status(400).json({ error: 'Day and meal type required.' })
  try {
    const entry = await prisma.mealEntry.create({
      data: {
        userId:    req.userId,
        weekStart: parseWeekStart(weekStart),
        day:       Number(day),
        mealType,
        name:      name.trim(),
        notes:     notes?.trim() || null,
        rating:    rating ? Number(rating) : null,
        tags:      Array.isArray(tags) ? tags : [],
      },
    })
    res.status(201).json({ entry })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── PATCH /api/meals/entries/:id ──────────────────────────────────
router.patch('/entries/:id', requireAuth, async (req, res) => {
  const existing = await prisma.mealEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Entry not found.' })
  const { name, notes, rating, tags } = req.body
  try {
    const entry = await prisma.mealEntry.update({
      where: { id: req.params.id },
      data: {
        ...(name   !== undefined && { name:   name.trim() }),
        ...(notes  !== undefined && { notes:  notes?.trim() || null }),
        ...(rating !== undefined && { rating: rating ? Number(rating) : null }),
        ...(tags   !== undefined && { tags }),
      },
    })
    res.json({ entry })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/meals/entries/:id ─────────────────────────────────
router.delete('/entries/:id', requireAuth, async (req, res) => {
  const existing = await prisma.mealEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Entry not found.' })
  await prisma.mealEntry.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// ── POST /api/meals/shop ──────────────────────────────────────────
router.post('/shop', requireAuth, async (req, res) => {
  const { weekStart, name, category, quantity } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required.' })
  try {
    const item = await prisma.shopItem.create({
      data: {
        userId:    req.userId,
        weekStart: parseWeekStart(weekStart),
        name:      name.trim(),
        category:  category?.trim() || null,
        quantity:  quantity?.trim() || null,
      },
    })
    res.status(201).json({ item })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── PATCH /api/meals/shop/:id ─────────────────────────────────────
router.patch('/shop/:id', requireAuth, async (req, res) => {
  const existing = await prisma.shopItem.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Item not found.' })
  const { name, category, quantity, checked } = req.body
  try {
    const item = await prisma.shopItem.update({
      where: { id: req.params.id },
      data: {
        ...(name     !== undefined && { name:     name.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(quantity !== undefined && { quantity: quantity?.trim() || null }),
        ...(checked  !== undefined && { checked }),
      },
    })
    res.json({ item })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/meals/shop/:id ────────────────────────────────────
router.delete('/shop/:id', requireAuth, async (req, res) => {
  const existing = await prisma.shopItem.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Item not found.' })
  await prisma.shopItem.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

module.exports = router
