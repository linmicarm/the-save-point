const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/', requireAuth, async (req, res) => {
  const milestones = await prisma.milestone.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'desc' },
  })
  res.json({ milestones })
})

router.get('/onthisday/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const today = new Date()
    const month = today.getMonth() + 1
    const day   = today.getDate()
    const currentYear = today.getFullYear()

    const all = await prisma.milestone.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { date: 'desc' },
    })

    const milestones = all.filter(m => {
      const d = new Date(m.date)
      return d.getMonth() + 1 === month && d.getDate() === day && d.getFullYear() < currentYear
    })

    res.json({ milestones })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

router.get('/public/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const milestones = await prisma.milestone.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { date: 'desc' },
  })
  res.json({ milestones })
})

router.post('/', requireAuth, async (req, res) => {
  const { title, date, description, emoji, category } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })
  if (!date) return res.status(400).json({ error: 'Date is required.' })
  const milestone = await prisma.milestone.create({
    data: {
      userId: req.userId,
      title: title.trim(),
      date: new Date(date),
      description: description?.trim() || null,
      emoji: emoji || null,
      category: category?.trim() || null,
    },
  })
  res.status(201).json({ milestone })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const m = await prisma.milestone.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!m) return res.status(404).json({ error: 'Milestone not found.' })
  const { title, date, description, emoji, category, isPublic } = req.body
  const updated = await prisma.milestone.update({
    where: { id: req.params.id },
    data: {
      ...(title       !== undefined && { title:       title?.trim()       || m.title }),
      ...(date        !== undefined && { date:        new Date(date) }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(emoji       !== undefined && { emoji:       emoji || null }),
      ...(category    !== undefined && { category:    category?.trim()    || null }),
      ...(isPublic    !== undefined && { isPublic }),
    },
  })
  res.json({ milestone: updated })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const m = await prisma.milestone.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!m) return res.status(404).json({ error: 'Milestone not found.' })
  await prisma.milestone.delete({ where: { id: req.params.id } })
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
