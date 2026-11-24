const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/follows/status/:username
router.get('/status/:username', optionalAuth, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username },
    })
    if (!target) return res.status(404).json({ error: 'User not found.' })

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: target.id } }),
      prisma.follow.count({ where: { followerId: target.id } }),
    ])

    let following = false
    if (req.userId) {
      const record = await prisma.follow.findFirst({
        where: { followerId: req.userId, followingId: target.id },
      })
      following = !!record
    }

    res.json({ following, followersCount, followingCount })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/follows/followers/:username
router.get('/followers/:username', async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username },
    })
    if (!target) return res.status(404).json({ error: 'User not found.' })

    const records = await prisma.follow.findMany({
      where: { followingId: target.id },
      include: {
        follower: { select: { username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const followers = records.map((r) => r.follower)
    res.json({ followers })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/follows/following/:username
router.get('/following/:username', async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username },
    })
    if (!target) return res.status(404).json({ error: 'User not found.' })

    const records = await prisma.follow.findMany({
      where: { followerId: target.id },
      include: {
        following: { select: { username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const following = records.map((r) => r.following)
    res.json({ following })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/follows/:username — follow a user
router.post('/:username', requireAuth, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username },
    })
    if (!target) return res.status(404).json({ error: 'User not found.' })
    if (target.id === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself.' })
    }

    // Create follow (ignore duplicate)
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
      update: {},
      create: { followerId: req.userId, followingId: target.id },
    })

    // Create notification for followed user
    await prisma.notification.create({
      data: {
        userId:   target.id,
        actorId:  req.userId,
        type:     'follow',
        entityId: null,
      },
    })

    res.json({ following: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/follows/:username — unfollow a user
router.delete('/:username', requireAuth, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username },
    })
    if (!target) return res.status(404).json({ error: 'User not found.' })

    await prisma.follow.deleteMany({
      where: { followerId: req.userId, followingId: target.id },
    })
    res.json({ following: false })
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

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = userId
  } catch {
    // ignore invalid token
  }
  next()
}

module.exports = router
