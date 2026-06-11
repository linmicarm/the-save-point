const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/search?q=...
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = req.query.q?.trim()
    if (!q) return res.json({ journal: [], milestones: [], commonplace: [], blog: [], places: [], recipes: [] })

    const mode = 'insensitive'

    const [journalEntries, milestones, commonplaceEntries, blogPosts, places, recipes] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId: req.userId, body: { contains: q, mode } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, body: true, createdAt: true },
      }),
      prisma.milestone.findMany({
        where: {
          OR: [
            {
              userId: req.userId,
              OR: [
                { title:       { contains: q, mode } },
                { description: { contains: q, mode } },
              ],
            },
            {
              isPublic: true,
              OR: [
                { title:       { contains: q, mode } },
                { description: { contains: q, mode } },
              ],
            },
          ],
        },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, title: true, description: true, userId: true, user: { select: { username: true } } },
      }),
      prisma.commonplaceEntry.findMany({
        where: {
          OR: [
            {
              userId: req.userId,
              OR: [
                { body:   { contains: q, mode } },
                { source: { contains: q, mode } },
              ],
            },
            {
              isPublic: true,
              OR: [
                { body:   { contains: q, mode } },
                { source: { contains: q, mode } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, body: true, source: true, userId: true, user: { select: { username: true } } },
      }),
      prisma.blogPost.findMany({
        where: {
          OR: [
            { userId: req.userId, title: { contains: q, mode } },
            { isPublic: true,     title: { contains: q, mode } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, userId: true, user: { select: { username: true } } },
      }),
      prisma.place.findMany({
        where: {
          OR: [
            {
              userId: req.userId,
              OR: [
                { name:        { contains: q, mode } },
                { description: { contains: q, mode } },
              ],
            },
            {
              isPublic: true,
              OR: [
                { name:        { contains: q, mode } },
                { description: { contains: q, mode } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, description: true, userId: true, user: { select: { username: true } } },
      }),
      prisma.recipe.findMany({
        where: {
          userId: req.userId,
          OR: [
            { title:       { contains: q, mode } },
            { description: { contains: q, mode } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, description: true },
      }),
    ])

    res.json({
      journal: journalEntries.map((e) => ({
        id:      e.id,
        title:   `Journal — ${new Date(e.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        excerpt: e.body.slice(0, 80),
        url:     '/journal',
      })),
      milestones: milestones.map((m) => ({
        id:      m.id,
        title:   m.title,
        excerpt: (m.description || '').slice(0, 80),
        url:     '/milestones',
      })),
      commonplace: commonplaceEntries.map((c) => ({
        id:      c.id,
        title:   'Quote',
        excerpt: c.body.slice(0, 80),
        url:     '/commonplace',
      })),
      blog: blogPosts.map((p) => ({
        id:      p.id,
        title:   p.title,
        excerpt: '',
        url:     p.userId !== req.userId ? `/u/${p.user.username}/blog/${p.slug}` : '/blog',
      })),
      places: places.map((p) => ({
        id:      p.id,
        title:   p.name,
        excerpt: (p.description || '').slice(0, 80),
        url:     '/places',
      })),
      recipes: recipes.map((r) => ({
        id:      r.id,
        title:   r.title,
        excerpt: (r.description || '').slice(0, 80),
        url:     '/recipes',
      })),
    })
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
