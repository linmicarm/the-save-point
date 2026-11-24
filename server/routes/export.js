const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/export
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId

    const [
      profile,
      journalEntries,
      milestones,
      commonplace,
      letters,
      places,
      wishlist,
      capsules,
      blogPosts,
      mediaLogs,
      recipes,
      photos,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          location: true,
          website: true,
          birthday: true,
          pronouns: true,
          accentColor: true,
          createdAt: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.milestone.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.commonplaceEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.letter.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.place.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wishItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.capsuleEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.blogPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mediaLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recipe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.photo.findMany({
        where: { userId },
        orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    const payload = {
      exportedAt:     new Date().toISOString(),
      profile,
      journalEntries,
      milestones,
      commonplace,
      letters,
      places,
      wishlist,
      capsules,
      blogPosts,
      mediaLogs,
      recipes,
      photos,
    }

    res.setHeader('Content-Disposition', 'attachment; filename="savepoint-export.json"')
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(payload, null, 2))
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
