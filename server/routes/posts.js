const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()
const MAX_BODY = 300

// ── auth helpers ──────────────────────────────────────────────────
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

// ── format helper ─────────────────────────────────────────────────
function formatPost(post, likedIds = new Set(), bookmarkedIds = new Set()) {
  return {
    id:           post.id,
    userId:       post.userId,
    body:         post.body,
    images:       post.images || [],
    createdAt:    post.createdAt,
    likeCount:    post._count?.likes    ?? 0,
    commentCount: post._count?.comments ?? 0,
    liked:        likedIds.has(post.id),
    bookmarked:   bookmarkedIds.has(post.id),
  }
}

// ── GET /api/posts/bookmarks — own saved posts ────────────────────
// (must come before /:id routes)
router.get('/bookmarks', requireAuth, async (req, res) => {
  try {
    const bookmarks = await prisma.postBookmark.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } },
            likes: { select: { userId: true } },
            comments: { select: { id: true } },
            bookmarks: { select: { userId: true } },
          }
        }
      }
    })
    res.json({ posts: bookmarks.map(b => b.post) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/posts/feed — posts from followed users + own ─────────
// (must come before /:id routes)
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const { cursor } = req.query
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true }
    })
    const feedUserIds = [req.userId, ...follows.map(f => f.followingId)]
    const posts = await prisma.post.findMany({
      where: { userId: { in: feedUserIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } },
        likes: { select: { userId: true } },
        comments: { select: { id: true } },
        bookmarks: { select: { userId: true } },
      }
    })
    res.json({ posts, nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/posts/user/:username — public feed ───────────────────
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const posts = await prisma.post.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: { _count: { select: { likes: true, comments: true } } },
    })

    let likedIds = new Set()
    let bookmarkedIds = new Set()
    if (req.userId && posts.length) {
      const ids = posts.map(p => p.id)
      const [ls, bs] = await Promise.all([
        prisma.postLike.findMany({     where: { userId: req.userId, postId: { in: ids } }, select: { postId: true } }),
        prisma.postBookmark.findMany({ where: { userId: req.userId, postId: { in: ids } }, select: { postId: true } }),
      ])
      likedIds      = new Set(ls.map(l => l.postId))
      bookmarkedIds = new Set(bs.map(b => b.postId))
    }

    res.json({ posts: posts.map(p => formatPost(p, likedIds, bookmarkedIds)) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/posts — all posts (discover feed) ────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { cursor } = req.query
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } },
        _count: { select: { likes: true, comments: true } },
      }
    })

    let likedIds = new Set()
    let bookmarkedIds = new Set()
    if (req.userId && posts.length) {
      const ids = posts.map(p => p.id)
      const [ls, bs] = await Promise.all([
        prisma.postLike.findMany({     where: { userId: req.userId, postId: { in: ids } }, select: { postId: true } }),
        prisma.postBookmark.findMany({ where: { userId: req.userId, postId: { in: ids } }, select: { postId: true } }),
      ])
      likedIds      = new Set(ls.map(l => l.postId))
      bookmarkedIds = new Set(bs.map(b => b.postId))
    }

    res.json({
      posts: posts.map(p => formatPost(p, likedIds, bookmarkedIds)),
      nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/posts — create ──────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { body, images } = req.body
  if (!body?.trim() && !(images?.length)) return res.status(400).json({ error: 'Post cannot be empty.' })
  if (body?.length > MAX_BODY) return res.status(400).json({ error: `Posts must be ${MAX_BODY} characters or fewer.` })
  try {
    const post = await prisma.post.create({
      data: {
        userId: req.userId,
        body:   body?.trim() ?? '',
        images: Array.isArray(images) && images.length ? images : undefined,
      },
      include: { _count: { select: { likes: true, comments: true } } },
    })
    res.status(201).json({ post: formatPost(post) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/posts/:id ─────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    await prisma.post.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/posts/:id/like — toggle ─────────────────────────────
router.post('/:id/like', requireAuth, async (req, res) => {
  const postId = req.params.id
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: req.userId } }
    })
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } })
    } else {
      await prisma.postLike.create({ data: { postId, userId: req.userId } })
      // notify the post owner (skip if liker is the post owner)
      if (post.userId !== req.userId) {
        await prisma.notification.create({
          data: { userId: post.userId, actorId: req.userId, type: 'post_like', entityId: postId }
        }).catch(() => {})
      }
    }
    const likeCount = await prisma.postLike.count({ where: { postId } })
    res.json({ liked: !existing, likeCount })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/posts/:id/bookmark — toggle ────────────────────────
router.post('/:id/bookmark', requireAuth, async (req, res) => {
  const postId = req.params.id
  try {
    const existing = await prisma.postBookmark.findUnique({
      where: { postId_userId: { postId, userId: req.userId } }
    })
    if (existing) {
      await prisma.postBookmark.delete({ where: { id: existing.id } })
    } else {
      await prisma.postBookmark.create({ data: { postId, userId: req.userId } })
    }
    res.json({ bookmarked: !existing })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── GET /api/posts/:id/comments ───────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.postComment.findMany({
      where:   { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } }
      },
    })
    res.json({ comments })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── POST /api/posts/:id/comments ─────────────────────────────────
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Comment cannot be empty.' })
  if (body.length > 500) return res.status(400).json({ error: 'Comment too long.' })
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { userId: true } })
    if (!post) return res.status(404).json({ error: 'Post not found.' })
    const comment = await prisma.postComment.create({
      data: { postId: req.params.id, userId: req.userId, body: body.trim() },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true, accentColor: true } }
      },
    })
    // notify the post owner (skip if commenter is the post owner)
    if (post.userId !== req.userId) {
      await prisma.notification.create({
        data: { userId: post.userId, actorId: req.userId, type: 'post_comment', entityId: req.params.id }
      }).catch(() => {})
    }
    res.status(201).json({ comment })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// ── DELETE /api/posts/comments/:id ───────────────────────────────
router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.postComment.findUnique({ where: { id: req.params.id } })
    if (!comment) return res.status(404).json({ error: 'Comment not found.' })
    // allow comment author OR post owner to delete
    const post = await prisma.post.findUnique({ where: { id: comment.postId }, select: { userId: true } })
    if (comment.userId !== req.userId && post?.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorised.' })
    }
    await prisma.postComment.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

module.exports = router
