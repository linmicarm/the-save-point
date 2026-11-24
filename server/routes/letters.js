const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/', requireAuth, async (req, res) => {
  const letters = await prisma.letter.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ letters })
})

router.get('/public/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const now = new Date()
  const letters = await prisma.letter.findMany({
    where: { userId: user.id, isPublic: true, OR: [{ openOn: null }, { openOn: { lte: now } }] },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ letters })
})

router.post('/', requireAuth, async (req, res) => {
  const { to, subject, body, openOn, isPublic } = req.body
  if (!to?.trim()) return res.status(400).json({ error: 'Recipient is required.' })
  if (!body?.trim()) return res.status(400).json({ error: 'Body is required.' })
  const letter = await prisma.letter.create({
    data: {
      userId: req.userId,
      to: to.trim(),
      subject: subject?.trim() || null,
      body: body.trim(),
      openOn: openOn ? new Date(openOn) : null,
      isPublic: isPublic || false,
    },
  })
  res.status(201).json({ letter })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const letter = await prisma.letter.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  const { to, subject, body, openOn, isPublic } = req.body
  const updated = await prisma.letter.update({
    where: { id: req.params.id },
    data: {
      ...(to       !== undefined && { to:       to?.trim()       || letter.to }),
      ...(subject  !== undefined && { subject:  subject?.trim()  || null }),
      ...(body     !== undefined && { body:     body?.trim()     || letter.body }),
      ...(openOn   !== undefined && { openOn:   openOn ? new Date(openOn) : null }),
      ...(isPublic !== undefined && { isPublic }),
    },
  })
  res.json({ letter: updated })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const letter = await prisma.letter.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  await prisma.letter.delete({ where: { id: req.params.id } })
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
