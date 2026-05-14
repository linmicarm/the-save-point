const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/discover — discoverable users with current season + currently fields
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isDiscoverable: true },
    select: {
      username: true,
      displayName: true,
      accentColor: true,
      currentlyWatching: true,
      currentlyReading: true,
      currentlyPlaying: true,
      currentlyListening: true,
      currentlyEating: true,
      seasons: {
        where: { endedAt: null },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          name: true,
          emoji: true,
          color: true,
          intention: true,
          coverUrl: true,
          startedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = users.map(u => ({
    username: u.username,
    displayName: u.displayName,
    accentColor: u.accentColor,
    season: u.seasons[0] || null,
    currently: {
      watching:  u.currentlyWatching,
      reading:   u.currentlyReading,
      playing:   u.currentlyPlaying,
      listening: u.currentlyListening,
      eating:    u.currentlyEating,
    },
  }))

  res.json({ users: formatted })
})

module.exports = router
