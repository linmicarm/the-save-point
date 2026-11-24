const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/', requireAuth, async (req, res) => {
  const entries = await prisma.capsuleEntry.findMany({
    where: { userId: req.userId },
    orderBy: { openOn: 'asc' },
  })
  res.json({ entries })
})

router.post('/', requireAuth, async (req, res) => {
  const { title, body, photoUrl, openOn, isPublic } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })
  if (!openOn) return res.status(400).json({ error: 'Open date is required.' })
  const entry = await prisma.capsuleEntry.create({
    data: {
      userId: req.userId,
      title: title.trim(),
      body: body?.trim() || null,
      photoUrl: photoUrl?.trim() || null,
      openOn: new Date(openOn),
      isPublic: isPublic || false,
    },
  })
  res.status(201).json({ entry })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.capsuleEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!entry) return res.status(404).json({ error: 'Capsule not found.' })
  const { title, body, photoUrl, openOn, isPublic } = req.body
  const updated = await prisma.capsuleEntry.update({
    where: { id: req.params.id },
    data: {
      ...(title    !== undefined && { title:    title?.trim()    || entry.title }),
      ...(body     !== undefined && { body:     body?.trim()     || null }),
      ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
      ...(openOn   !== undefined && { openOn:   new Date(openOn) }),
      ...(isPublic !== undefined && { isPublic }),
    },
  })
  res.json({ entry: updated })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.capsuleEntry.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!entry) return res.status(404).json({ error: 'Capsule not found.' })
  await prisma.capsuleEntry.delete({ where: { id: req.params.id } })
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
