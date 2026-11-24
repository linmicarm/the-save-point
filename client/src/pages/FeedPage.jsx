import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'


function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (h < 1) return m + 'm ago'
  if (day < 1) return h + 'h ago'
  if (day < 7) return day + 'd ago'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Avatar({ user: postUser, size = 8 }) {
  const initial = (postUser?.displayName || postUser?.username || '?')[0].toUpperCase()
  const accent = postUser?.accentColor || '#c4b5fd'
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}
      style={{ background: accent }}
    >
      {postUser?.avatarUrl
        ? <img src={postUser.avatarUrl} alt="" className={`w-${size} h-${size} rounded-full object-cover`} />
        : initial}
    </div>
  )
}

function ImageGrid({ urls }) {
  if (!urls || urls.length === 0) return null
  const parsed = typeof urls === 'string' ? JSON.parse(urls) : urls
  if (!parsed || parsed.length === 0) return null

  if (parsed.length === 1) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden">
        <img src={parsed[0]} alt="" className="w-full max-h-80 object-cover" />
      </div>
    )
  }

  return (
    <div className={`mt-3 grid gap-1 rounded-xl overflow-hidden ${parsed.length === 2 ? 'grid-cols-2' : parsed.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {parsed.slice(0, 4).map((url, i) => (
        <div key={i} className="relative aspect-square">
          <img src={url} alt="" className="w-full h-full object-cover" />
          {i === 3 && parsed.length > 4 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">+{parsed.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CommentSection({ postId, currentUser }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    axios.get(`/api/posts/${postId}/comments`)
      .then(res => setComments(res.data.comments || []))
      .finally(() => setLoading(false))
  }, [postId])

  const submitComment = async () => {
    if (!text.trim()) return
    setPosting(true)
    try {
      const res = await axios.post(`/api/posts/${postId}/comments`, { content: text.trim() })
      setComments(prev => [...prev, res.data.comment])
      setText('')
    } finally {
      setPosting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#f0ecfb]">
      {loading ? (
        <p className="text-xs text-[#c4b8d9] py-2">loading comments...</p>
      ) : (
        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-[#c4b8d9]">no comments yet</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Link to={`/u/${c.author?.username}`}>
                <Avatar user={c.author} size={6} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <Link to={`/u/${c.author?.username}`} className="text-xs font-semibold text-[#2d2a35] hover:underline truncate">
                    {c.author?.displayName || c.author?.username}
                  </Link>
                  <span className="text-[10px] text-[#c4b8d9] shrink-0">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs text-[#5a5065] leading-relaxed mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2.5 pt-1">
            <Avatar user={currentUser} size={6} />
            <div className="flex-1 flex gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="add a comment..."
                rows={1}
                className="flex-1 text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
                style={{ minHeight: '34px' }}
              />
              <button
                onClick={submitComment}
                disabled={posting || !text.trim()}
                className="text-[10px] px-3 py-1.5 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-40 transition-colors self-end"
              >
                {posting ? '...' : 'post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PostCard({ post: initialPost, currentUser }) {
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)

  const isLiked = post.likes?.some(l => l.userId === currentUser?.id)
  const isBookmarked = post.bookmarks?.some(b => b.userId === currentUser?.id)

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await axios.delete(`/api/posts/${post.id}/like`)
        setPost(p => ({ ...p, likes: p.likes.filter(l => l.userId !== currentUser?.id) }))
      } else {
        await axios.post(`/api/posts/${post.id}/like`)
        setPost(p => ({ ...p, likes: [...(p.likes || []), { userId: currentUser?.id }] }))
      }
    } catch {
      // ignore
    }
  }

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await axios.delete(`/api/posts/${post.id}/bookmark`)
        setPost(p => ({ ...p, bookmarks: p.bookmarks.filter(b => b.userId !== currentUser?.id) }))
      } else {
        await axios.post(`/api/posts/${post.id}/bookmark`)
        setPost(p => ({ ...p, bookmarks: [...(p.bookmarks || []), { userId: currentUser?.id }] }))
      }
    } catch {
      // ignore
    }
  }

  const accent = post.author?.accentColor || '#c4b5fd'

  return (
    <div className="bg-white border border-[#e4dff0] rounded-2xl px-5 py-4" style={{ borderColor: 'var(--sp-border)' }}>
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/u/${post.author?.username}`}>
          <Avatar user={post.author} size={9} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <Link to={`/u/${post.author?.username}`} className="text-sm font-semibold text-[#2d2a35] hover:underline truncate">
              {post.author?.displayName || post.author?.username}
            </Link>
            <span className="text-xs text-[#a89bc2] truncate">@{post.author?.username}</span>
          </div>
          <p className="text-[11px] text-[#c4b8d9]">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Body */}
      {post.content && (
        <p className="text-sm text-[#2d2a35] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Images */}
      <ImageGrid urls={post.images} />

      {/* Action row */}
      <div className="flex items-center gap-5 mt-4">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: isLiked ? '#fb7185' : '#c4b8d9' }}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{post.likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: showComments ? '#a89bc2' : '#c4b8d9' }}
        >
          <span>💬</span>
          <span>{post._count?.comments ?? post.comments?.length ?? 0}</span>
        </button>

        <button
          onClick={toggleBookmark}
          className="flex items-center gap-1.5 text-xs transition-colors ml-auto"
          style={{ color: isBookmarked ? accent : '#c4b8d9' }}
        >
          <span>{isBookmarked ? '🔖' : '🔖'}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} currentUser={currentUser} />}
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    axios.get('/api/posts/feed')
      .then(res => {
        setPosts(res.data.posts || [])
        setNextCursor(res.data.nextCursor ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await axios.get(`/api/posts/feed?cursor=${nextCursor}`)
      setPosts(prev => [...prev, ...(res.data.posts || [])])
      setNextCursor(res.data.nextCursor ?? null)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <p className="text-sm text-[#a89bc2]">loading your feed...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <div className="max-w-2xl mx-auto px-5 py-8 pt-2">
        <h1
          className="text-2xl font-medium text-[#2d2a35] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          feed
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">what's happening with people you follow</p>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-4">✦</p>
            <p className="text-sm text-[#a89bc2] mb-2">your feed is quiet</p>
            <p className="text-xs text-[#c4b8d9] mb-6">
              visit discover to find people to follow
            </p>
            <Link
              to="/discover"
              className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors"
            >
              discover people
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        )}

        {nextCursor && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs px-5 py-2 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] hover:text-[#5a5065] transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'loading…' : 'load more'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-10">✦ the save point</p>
      </div>
    </div>
  )
}
