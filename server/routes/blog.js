const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = require('../db')

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

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    try {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = userId
    } catch {}
  }
  next()
}

function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '') || 'post'
}

async function uniqueSlug(userId, base) {
  let slug = base
  let i = 1
  while (await prisma.blogPost.findUnique({ where: { userId_slug: { userId, slug } } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

const POST_SELECT = {
  include: {
    user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } },
    _count: { select: { comments: true } },
  }
}

// ── GET /api/blog/user/:username  — public post list ─────────────
// Must be before /:id routes
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const posts = await prisma.blogPost.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: 'desc' },
      ...POST_SELECT,
    })
    res.json({ posts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/blog/user/:username/:slug  — single public post ──────
router.get('/user/:username/:slug', optionalAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const post = await prisma.blogPost.findUnique({
      where: { userId_slug: { userId: user.id, slug: req.params.slug } },
      ...POST_SELECT,
    })
    if (!post || (!post.isPublic && req.userId !== user.id)) {
      return res.status(404).json({ error: 'Post not found.' })
    }
    res.json({ post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/blog/:id  — single own post (for editor) ────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { _count: { select: { comments: true } } },
    })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    res.json({ post })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/blog  — own posts list ───────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true } } },
    })
    res.json({ posts })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/blog  — create ──────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { title, content, coverUrl, tags, mood, music, isPublic } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' })
  try {
    const base = slugify(title.trim())
    const slug = await uniqueSlug(req.userId, base)
    const post = await prisma.blogPost.create({
      data: {
        userId:   req.userId,
        title:    title.trim(),
        slug,
        content:  Array.isArray(content) ? content : [],
        coverUrl: coverUrl || null,
        tags:     Array.isArray(tags) ? tags : [],
        mood:     mood?.trim()  || null,
        music:    music?.trim() || null,
        isPublic: isPublic === true,
      },
      include: { _count: { select: { comments: true } } },
    })
    res.status(201).json({ post })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── PATCH /api/blog/:id  — update ────────────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.blogPost.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!existing) return res.status(404).json({ error: 'Post not found.' })
    const { title, content, coverUrl, tags, mood, music, isPublic } = req.body
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(title    !== undefined && { title:    title.trim() }),
        ...(content  !== undefined && { content }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(tags     !== undefined && { tags }),
        ...(mood     !== undefined && { mood:     mood?.trim()  || null }),
        ...(music    !== undefined && { music:    music?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: { _count: { select: { comments: true } } },
    })
    res.json({ post })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/blog/:id ──────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.blogPost.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    await prisma.blogPost.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/blog/:id/comments ────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.blogComment.findMany({
      where:   { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } } },
    })
    res.json({ comments })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/blog/:id/comments ───────────────────────────────────
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Comment cannot be empty.' })
  if (body.length > 1000) return res.status(400).json({ error: 'Comment too long.' })
  try {
    const post = await prisma.blogPost.findFirst({ where: { id: req.params.id } })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    const comment = await prisma.blogComment.create({
      data: { postId: req.params.id, userId: req.userId, body: body.trim() },
      include: { user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } } },
    })
    // notify the blog post owner (skip if commenter is the post owner)
    if (post.userId !== req.userId) {
      await prisma.notification.create({
        data: { userId: post.userId, actorId: req.userId, type: 'blog_comment', entityId: post.id }
      }).catch(() => {})
    }
    res.status(201).json({ comment })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/blog/comments/:id ────────────────────────────────
router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.blogComment.findUnique({ where: { id: req.params.id } })
    if (!comment) return res.status(404).json({ error: 'Comment not found.' })
    const post = await prisma.blogPost.findUnique({ where: { id: comment.postId }, select: { userId: true } })
    if (comment.userId !== req.userId && post?.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorised.' })
    }
    await prisma.blogComment.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
