const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /public/:username  (no auth)
router.get('/public/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const photos = await prisma.photo.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ photos })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/photos
router.get('/', requireAuth, async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { userId: req.userId },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ photos })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/photos
router.post('/', requireAuth, async (req, res) => {
  try {
    const { url, caption, takenAt, tags, isPublic, seasonId } = req.body
    if (!url?.trim()) return res.status(400).json({ error: 'URL is required.' })

    const photo = await prisma.photo.create({
      data: {
        userId:   req.userId,
        url:      url.trim(),
        caption:  caption  || null,
        takenAt:  takenAt  ? new Date(takenAt) : null,
        tags:     tags     || [],
        isPublic: isPublic ?? false,
        seasonId: seasonId || null,
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.status(201).json({ photo })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// PATCH /api/photos/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.photo.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Photo not found.' })

    const { caption, tags, takenAt, isPublic, seasonId } = req.body
    const updated = await prisma.photo.update({
      where: { id: req.params.id },
      data: {
        ...(caption  !== undefined && { caption:  caption  || null }),
        ...(tags     !== undefined && { tags }),
        ...(takenAt  !== undefined && { takenAt:  takenAt ? new Date(takenAt) : null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(seasonId !== undefined && { seasonId: seasonId || null }),
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ photo: updated })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/photos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.photo.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Photo not found.' })
    await prisma.photo.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
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
