const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: {
          select: { username: true, displayName: true, avatarUrl: true },
        },
      },
    })
    res.json({ notifications })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/notifications/unread
router.get('/unread', requireAuth, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId, read: false },
    })
    res.json({ count })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/notifications/read
router.post('/read', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body
    const where = ids?.length
      ? { userId: req.userId, id: { in: ids } }
      : { userId: req.userId }

    await prisma.notification.updateMany({
      where,
      data: { read: true },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/notifications/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Notification not found.' })
    await prisma.notification.delete({ where: { id: req.params.id } })
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
