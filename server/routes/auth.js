const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const { PrismaClient } = require('@prisma/client')

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required.' })
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    // Always return success to prevent email enumeration
    if (!user) return res.json({ ok: true })

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@savepoint.app',
        to: user.email,
        subject: 'Reset your Save Point password',
        html: `<p>Hi ${user.displayName},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`,
      })
    }

    // In development or when email not configured, log the link
    if (!process.env.SMTP_HOST) {
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`)
    }

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token and password required.' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    })
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' })

    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, passwordResetToken: null, passwordResetExpiry: null },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
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

function sanitize(user) {
  const { passwordHash, ...safe } = user
  return safe
}

module.exports = router
