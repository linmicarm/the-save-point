const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/public/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const entries = await prisma.commonplaceEntry.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!entries.length) return res.json({ entry: null })
    // return a random public entry for variety
    const entry = entries[Math.floor(Math.random() * entries.length)]
    res.json({ entry })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

router.get('/', requireAuth, async (req, res) => {
  const entries = await prisma.commonplaceEntry.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ entries })
})

router.post('/', requireAuth, async (req, res) => {
  const { body, source, tags, note, isPublic } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Quote is required.' })
  const entry = await prisma.commonplaceEntry.create({
    data: {
      userId: req.userId,
      body: body.trim(),
      source: source?.trim() || null,
      tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      note: note?.trim() || null,
      isPublic: isPublic === true,
    },
  })
  res.status(201).json({ entry })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.commonplaceEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  const { body, source, tags, note, isPublic } = req.body
  const updated = await prisma.commonplaceEntry.update({
    where: { id: req.params.id },
    data: {
      ...(body     !== undefined && { body:     body?.trim()   || entry.body }),
      ...(source   !== undefined && { source:   source?.trim() || null }),
      ...(tags     !== undefined && { tags:     Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [] }),
      ...(note     !== undefined && { note:     note?.trim()   || null }),
      ...(isPublic !== undefined && { isPublic: isPublic === true }),
    },
  })
  res.json({ entry: updated })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.commonplaceEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  await prisma.commonplaceEntry.delete({ where: { id: req.params.id } })
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
