const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/medialog/public/:username — public entries for profile page
router.get('/public/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const mediaLogs = await prisma.mediaLog.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ mediaLogs })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/medialog
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, status } = req.query
    const where = { userId: req.userId }
    if (type)   where.type   = type
    if (status) where.status = status

    const mediaLogs = await prisma.mediaLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ mediaLogs })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/medialog
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      type, title, creator, coverUrl, status,
      rating, notes, startedAt, finishedAt, tags, isPublic, seasonId,
    } = req.body
    if (!type?.trim())  return res.status(400).json({ error: 'Type is required.' })
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })

    const entry = await prisma.mediaLog.create({
      data: {
        userId:     req.userId,
        type:       type.trim(),
        title:      title.trim(),
        creator:    creator    || null,
        coverUrl:   coverUrl   || null,
        status:     status     || 'want',
        rating:     rating     ?? null,
        notes:      notes      || null,
        startedAt:  startedAt  ? new Date(startedAt)  : null,
        finishedAt: finishedAt ? new Date(finishedAt) : null,
        tags:       tags       || [],
        isPublic:   isPublic   ?? false,
        seasonId:   seasonId   || null,
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.status(201).json({ entry })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// PATCH /api/medialog/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.mediaLog.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Entry not found.' })

    const {
      type, title, creator, coverUrl, status,
      rating, notes, startedAt, finishedAt, tags, isPublic, seasonId,
    } = req.body

    const updated = await prisma.mediaLog.update({
      where: { id: req.params.id },
      data: {
        ...(type       !== undefined && { type }),
        ...(title      !== undefined && { title }),
        ...(creator    !== undefined && { creator:    creator    || null }),
        ...(coverUrl   !== undefined && { coverUrl:   coverUrl   || null }),
        ...(status     !== undefined && { status }),
        ...(rating     !== undefined && { rating:     rating     ?? null }),
        ...(notes      !== undefined && { notes:      notes      || null }),
        ...(startedAt  !== undefined && { startedAt:  startedAt  ? new Date(startedAt)  : null }),
        ...(finishedAt !== undefined && { finishedAt: finishedAt ? new Date(finishedAt) : null }),
        ...(tags       !== undefined && { tags }),
        ...(isPublic   !== undefined && { isPublic }),
        ...(seasonId   !== undefined && { seasonId:   seasonId   || null }),
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ entry: updated })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/medialog/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.mediaLog.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Entry not found.' })
    await prisma.mediaLog.delete({ where: { id: req.params.id } })
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
