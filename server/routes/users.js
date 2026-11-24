const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

const PUBLIC_FIELDS = {
  id: true, username: true, displayName: true, bio: true, pinnedQuote: true,
  avatarUrl: true, accentColor: true, isDiscoverable: true,
  pronouns: true, location: true, website: true, birthday: true, headerUrl: true,
  currentlyWatching: true, currentlyReading: true, currentlyPlaying: true,
  currentlyListening: true, currentlyEating: true, currentlyDrinking: true,
  currentlyMaking: true,
  createdAt: true, updatedAt: true,
}

const DEFAULT_SECTION_ORDER = [
  'currently', 'journal', 'mood', 'shelf',
  'places', 'milestones', 'now', 'onthisday',
  'commonplace', 'blog', 'updates',
]
const DEFAULT_SECTION_VISIBLE = Object.fromEntries(DEFAULT_SECTION_ORDER.map(k => [k, true]))

// ─── PATCH /api/users/password ────────────────────────────────
router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required.' })
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' })
    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: hash } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ─── DELETE /api/users/account ───────────────────────────────
router.delete('/account', requireAuth, async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required.' })
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(400).json({ error: 'Incorrect password.' })
    await prisma.user.delete({ where: { id: req.userId } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ─── GET /api/users/page-settings ────────────────────────────
// Must come before GET /:username to avoid being consumed as a username lookup
router.get('/page-settings', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.userPageSettings.findUnique({
      where: { userId: req.userId },
    })
    res.json({
      sectionsOrder:   settings?.sectionsOrder   ?? DEFAULT_SECTION_ORDER,
      sectionsVisible: settings?.sectionsVisible ?? DEFAULT_SECTION_VISIBLE,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ─── PATCH /api/users/page-settings ──────────────────────────
router.patch('/page-settings', requireAuth, async (req, res) => {
  try {
    const { sectionsOrder, sectionsVisible } = req.body
    const updateData = {}
    if (sectionsOrder   !== undefined) updateData.sectionsOrder   = sectionsOrder
    if (sectionsVisible !== undefined) updateData.sectionsVisible = sectionsVisible

    const settings = await prisma.userPageSettings.upsert({
      where:  { userId: req.userId },
      update: updateData,
      create: {
        userId:          req.userId,
        sectionsOrder:   updateData.sectionsOrder   ?? DEFAULT_SECTION_ORDER,
        sectionsVisible: updateData.sectionsVisible ?? DEFAULT_SECTION_VISIBLE,
      },
    })
    res.json({
      sectionsOrder:   settings.sectionsOrder   ?? DEFAULT_SECTION_ORDER,
      sectionsVisible: settings.sectionsVisible ?? DEFAULT_SECTION_VISIBLE,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ─── PATCH /api/users/me ─────────────────────────────────────
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = [
    'displayName', 'bio', 'pinnedQuote', 'pronouns', 'location', 'website', 'birthday', 'headerUrl', 'avatarUrl', 'accentColor', 'isDiscoverable',
    'currentlyWatching', 'currentlyReading', 'currentlyPlaying',
    'currentlyListening', 'currentlyEating', 'currentlyDrinking', 'currentlyMaking',
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

// ─── GET /api/users/:username ─────────────────────────────────
// Parameterized route last so specific routes above take precedence
router.get('/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        ...PUBLIC_FIELDS,
        pageSettings: {
          select: { sectionsOrder: true, sectionsVisible: true },
        },
        _count: {
          select: {
            posts:      true,
            seasons:    true,
            milestones: { where: { isPublic: true } },
          },
        },
      },
    })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const { _count, pageSettings, ...userData } = user
    res.json({
      user:         userData,
      counts:       _count,
      pageSettings: pageSettings
        ? {
            sectionsOrder:   pageSettings.sectionsOrder   ?? DEFAULT_SECTION_ORDER,
            sectionsVisible: pageSettings.sectionsVisible ?? DEFAULT_SECTION_VISIBLE,
          }
        : { sectionsOrder: DEFAULT_SECTION_ORDER, sectionsVisible: DEFAULT_SECTION_VISIBLE },
    })
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
