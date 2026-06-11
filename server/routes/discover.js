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
      currentlyWatching: true, currentlyReading: true, currentlyPlaying: true,
      currentlyListening: true, currentlyEating: true, currentlyDrinking: true,
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
    // expose first item title from each array for the activity feed
    currently: {
      watching:  (u.currentlyWatching  || [])[0]?.title || null,
      reading:   (u.currentlyReading   || [])[0]?.title || null,
      playing:   (u.currentlyPlaying   || [])[0]?.title || null,
      listening: (u.currentlyListening || [])[0]?.title || null,
      eating:    (u.currentlyEating    || [])[0]?.title || null,
      drinking:  (u.currentlyDrinking  || [])[0]?.title || null,
    },
  }))

  res.json({ users: formatted })
})

module.exports = router
