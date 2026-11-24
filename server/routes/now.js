const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

router.get('/', requireAuth, async (req, res) => {
  const entry = await prisma.nowEntry.findUnique({ where: { userId: req.userId } })
  res.json({ entry })
})

router.get('/public/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const entry = await prisma.nowEntry.findUnique({ where: { userId: user.id } })
  if (!entry?.isPublic) return res.status(404).json({ error: 'Not shared.' })
  res.json({ entry })
})

router.put('/', requireAuth, async (req, res) => {
  const { focus, building, learning, feeling, location, isPublic } = req.body
  const entry = await prisma.nowEntry.upsert({
    where: { userId: req.userId },
    create: {
      userId: req.userId,
      focus:    focus?.trim()    || null,
      building: building?.trim() || null,
      learning: learning?.trim() || null,
      feeling:  feeling?.trim()  || null,
      location: location?.trim() || null,
      isPublic: isPublic || false,
    },
    update: {
      ...(focus    !== undefined && { focus:    focus?.trim()    || null }),
      ...(building !== undefined && { building: building?.trim() || null }),
      ...(learning !== undefined && { learning: learning?.trim() || null }),
      ...(feeling  !== undefined && { feeling:  feeling?.trim()  || null }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(isPublic !== undefined && { isPublic }),
    },
  })
  res.json({ entry })
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
