const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

// GET /api/rhythm
router.get('/', requireAuth, async (req, res) => {
  const blocks = await prisma.rhythmBlock.findMany({
    where: { userId: req.userId },
    orderBy: { position: 'asc' },
  })
  res.json({ blocks })
})

// POST /api/rhythm — create a block
router.post('/', requireAuth, async (req, res) => {
  const { label } = req.body
  if (!label?.trim()) return res.status(400).json({ error: 'Label is required.' })

  const last = await prisma.rhythmBlock.findFirst({
    where: { userId: req.userId },
    orderBy: { position: 'desc' },
  })

  const block = await prisma.rhythmBlock.create({
    data: {
      userId: req.userId,
      label: label.trim(),
      items: [],
      position: (last?.position ?? -1) + 1,
    },
  })
  res.status(201).json({ block })
})

// PATCH /api/rhythm/:id — update label or items
router.patch('/:id', requireAuth, async (req, res) => {
  const block = await prisma.rhythmBlock.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!block) return res.status(404).json({ error: 'Block not found.' })

  const { label, items } = req.body
  const updated = await prisma.rhythmBlock.update({
    where: { id: req.params.id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(items !== undefined && { items }),
    },
  })
  res.json({ block: updated })
})

// POST /api/rhythm/reorder — save new positions
router.post('/reorder', requireAuth, async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array.' })

  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.rhythmBlock.updateMany({
        where: { id, userId: req.userId },
        data: { position: idx },
      })
    )
  )
  res.json({ ok: true })
})

// DELETE /api/rhythm/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const block = await prisma.rhythmBlock.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!block) return res.status(404).json({ error: 'Block not found.' })
  await prisma.rhythmBlock.delete({ where: { id: req.params.id } })
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
