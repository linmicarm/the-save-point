const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/recipes/public/:username — no auth required (must be before /:id)
router.get('/public/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ recipes })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/recipes
router.get('/', requireAuth, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ recipes })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/recipes
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, description, ingredients, steps, coverUrl,
      tags, prepTime, cookTime, servings, rating, notes, isPublic,
    } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })

    const recipe = await prisma.recipe.create({
      data: {
        userId:      req.userId,
        title:       title.trim(),
        description: description || null,
        ingredients: ingredients ?? null,
        steps:       steps       ?? null,
        coverUrl:    coverUrl    || null,
        tags:        tags        || [],
        prepTime:    prepTime    ?? null,
        cookTime:    cookTime    ?? null,
        servings:    servings    ?? null,
        rating:      rating      ?? null,
        notes:       notes       || null,
        isPublic:    isPublic    ?? false,
      },
    })
    res.status(201).json({ recipe })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// PATCH /api/recipes/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Recipe not found.' })

    const {
      title, description, ingredients, steps, coverUrl,
      tags, prepTime, cookTime, servings, rating, notes, isPublic,
    } = req.body

    const updated = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        ...(title       !== undefined && { title:       title?.trim() || existing.title }),
        ...(description !== undefined && { description: description || null }),
        ...(ingredients !== undefined && { ingredients: ingredients ?? null }),
        ...(steps       !== undefined && { steps:       steps       ?? null }),
        ...(coverUrl    !== undefined && { coverUrl:    coverUrl    || null }),
        ...(tags        !== undefined && { tags }),
        ...(prepTime    !== undefined && { prepTime:    prepTime    ?? null }),
        ...(cookTime    !== undefined && { cookTime:    cookTime    ?? null }),
        ...(servings    !== undefined && { servings:    servings    ?? null }),
        ...(rating      !== undefined && { rating:      rating      ?? null }),
        ...(notes       !== undefined && { notes:       notes       || null }),
        ...(isPublic    !== undefined && { isPublic }),
      },
    })
    res.json({ recipe: updated })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// DELETE /api/recipes/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Recipe not found.' })
    await prisma.recipe.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
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
