const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('../../../generated/prisma')

const router = express.Router()
const prisma = new PrismaClient()

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, username, password, displayName } = req.body

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required.' })
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      const field = existing.email === email ? 'email' : 'username'
      return res.status(409).json({ error: `That ${field} is already taken.` })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, username, displayName: displayName || username, passwordHash },
    })

    res.status(201).json({ token: signToken(user.id), user: sanitize(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' })

    res.json({ token: signToken(user.id), user: sanitize(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/auth/me  (protected)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json({ user: sanitize(user) })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/auth/check-username/:username
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params
  const exists = await prisma.user.findUnique({ where: { username } })
  res.json({ available: !exists })
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

function sanitize(user) {
  const { passwordHash, ...safe } = user
  return safe
}

module.exports = router
