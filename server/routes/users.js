const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

const PUBLIC_FIELDS = {
  id: true, username: true, displayName: true, bio: true,
  avatarUrl: true, accentColor: true, isDiscoverable: true,
  currentlyWatching: true, currentlyReading: true,
  currentlyPlaying: true, currentlyEating: true, currentlyListening: true,
  createdAt: true,
}

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: PUBLIC_FIELDS,
    })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// PATCH /api/users/me — update own profile (protected)
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = [
    'displayName', 'bio', 'accentColor', 'isDiscoverable',
    'currentlyWatching', 'currentlyReading',
    'currentlyPlaying', 'currentlyEating', 'currentlyListening',
  ]
  const data = {}
  for (const key of allowed) {
    if (key in req.body) data[key] = req.body[key]
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: PUBLIC_FIELDS,
    })
    res.json({ user })
  } catch (err) {
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
