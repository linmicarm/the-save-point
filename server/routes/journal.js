const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

const PROMPTS = [
  "What felt soft today?",
  "What are you quietly proud of this week?",
  "What does your body need right now?",
  "What's been living rent-free in your mind lately?",
  "What would you tell yourself from a month ago?",
  "What small thing made today feel a little better?",
  "What are you in the middle of figuring out?",
  "What do you want to remember about this season?",
  "What have you been avoiding, and why?",
  "What does rest look like for you right now?",
  "Who have you been thinking about lately?",
  "What changed in you this month, even a little?",
  "What are you still learning to let go of?",
  "What does this time of your life want from you?",
  "What brought you unexpected joy recently?",
  "What conversation do you need to have with yourself?",
  "What are you building, slowly and quietly?",
  "What's something you noticed today that you'd normally walk past?",
  "What would enough look like right now?",
  "What are you in the process of becoming?",
  "What does your current season smell like, sound like, feel like?",
  "What are you grateful for that you haven't said out loud?",
  "What part of your old self are you leaving behind?",
  "What feels unfinished? Does it need to be finished?",
  "What have you been too hard on yourself about?",
  "What do you want more of? Less of?",
  "What story about yourself are you ready to rewrite?",
  "What's one thing that felt true today?",
  "What are you protecting? Is it worth protecting?",
  "What made you feel most like yourself lately?",
]

const getDailyPrompt = () => {
  const day = Math.floor(Date.now() / 86400000)
  return PROMPTS[day % PROMPTS.length]
}

// GET /api/journal/prompt
router.get('/prompt', (req, res) => {
  res.json({ prompt: getDailyPrompt() })
})

// GET /api/journal — current user's entries
router.get('/', requireAuth, async (req, res) => {
  const { seasonId, limit = 20, offset = 0 } = req.query
  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: req.userId,
      ...(seasonId && { seasonId }),
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: Number(offset),
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.json({ entries })
})

// GET /api/journal/:id
router.get('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  res.json({ entry })
})

// POST /api/journal
router.post('/', requireAuth, async (req, res) => {
  const { body, mood, prompt } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Entry body is required.' })

  const activeSeason = await prisma.season.findFirst({
    where: { userId: req.userId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })

  const entry = await prisma.journalEntry.create({
    data: {
      userId: req.userId,
      seasonId: activeSeason?.id || null,
      body: body.trim(),
      mood: mood?.trim() || null,
      prompt: prompt || null,
    },
    include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
  })
  res.status(201).json({ entry })
})

// DELETE /api/journal/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!entry) return res.status(404).json({ error: 'Entry not found.' })
  await prisma.journalEntry.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
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
