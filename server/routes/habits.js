const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/habits/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query
    const where = { userId: req.userId }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from
      if (to) where.date.lte = to
    }
    const logs = await prisma.habitLog.findMany({
      where,
      orderBy: { date: 'asc' },
    })
    res.json({ logs })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/habits
router.get('/', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, archived: false },
      orderBy: { position: 'asc' },
      include: {
        logs: { where: { date: today }, take: 1 },
        season: { select: { id: true, name: true, emoji: true, color: true } },
      },
    })

    // Calculate streak for each habit
    const habitsWithStreak = await Promise.all(
      habits.map(async (habit) => {
        const todayLog = habit.logs[0] || null

        // Get all logs ordered by date desc to compute streak
        const allLogs = await prisma.habitLog.findMany({
          where: { habitId: habit.id },
          orderBy: { date: 'desc' },
          select: { date: true },
        })

        const logDates = new Set(allLogs.map((l) => l.date))

        // Count consecutive days going back from yesterday
        let streak = 0
        const cursor = new Date()
        cursor.setUTCDate(cursor.getUTCDate() - 1)

        while (true) {
          const dateStr = cursor.toISOString().slice(0, 10)
          if (logDates.has(dateStr)) {
            streak++
            cursor.setUTCDate(cursor.getUTCDate() - 1)
          } else {
            break
          }
        }

        const { logs: _logs, ...habitData } = habit
        return { ...habitData, todayLog, streak }
      })
    )

    res.json({ habits: habitsWithStreak })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/habits
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, emoji, color, frequency, seasonId } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' })
    const habit = await prisma.habit.create({
      data: {
        userId:    req.userId,
        name:      name.trim(),
        emoji:     emoji || null,
        color:     color || '#c4b5fd',
        frequency: frequency || 'daily',
        seasonId:  seasonId || null,
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.status(201).json({ habit })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// PATCH /api/habits/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!habit) return res.status(404).json({ error: 'Habit not found.' })

    const { name, emoji, color, frequency, position, archived, seasonId } = req.body
    const updated = await prisma.habit.update({
      where: { id: req.params.id },
      data: {
        ...(name      !== undefined && { name:      name?.trim() || habit.name }),
        ...(emoji     !== undefined && { emoji:     emoji || null }),
        ...(color     !== undefined && { color }),
        ...(frequency !== undefined && { frequency }),
        ...(position  !== undefined && { position }),
        ...(archived  !== undefined && { archived }),
        ...(seasonId  !== undefined && { seasonId:  seasonId || null }),
      },
      include: { season: { select: { id: true, name: true, emoji: true, color: true } } },
    })
    res.json({ habit: updated })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/habits/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!habit) return res.status(404).json({ error: 'Habit not found.' })
    await prisma.habit.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/habits/:id/log
router.post('/:id/log', requireAuth, async (req, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!habit) return res.status(404).json({ error: 'Habit not found.' })

    const { date, value = 1, note } = req.body
    if (!date) return res.status(400).json({ error: 'Date is required.' })

    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: habit.id, date } },
      update: { value, note: note || null },
      create: {
        habitId: habit.id,
        userId: req.userId,
        date,
        value,
        note: note || null,
      },
    })
    res.json({ log })
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
