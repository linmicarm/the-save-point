import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PostCard({ post, accent, onUnbookmark }) {
  const accentRgb = hexToRgb(accent)
  const [removing, setRemoving] = useState(false)

  const handleUnbookmark = async () => {
    setRemoving(true)
    try {
      await onUnbookmark(post.id)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div
      className="bg-white border rounded-2xl p-5 group transition-shadow hover:shadow-sm"
      style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}
    >
      {/* author row */}
      <div className="flex items-center justify-between mb-3">
        <Link
          to={`/u/${post.author?.username}`}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          {post.author?.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ background: accent }}
            >
              {(post.author?.displayName || post.author?.username || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-[#2d2a35] leading-none">
              {post.author?.displayName || post.author?.username}
            </p>
            <p className="text-[10px] text-[#a89bc2] mt-0.5">@{post.author?.username}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#c4b8d9]">{timeAgo(post.createdAt)}</span>
          <button
            onClick={handleUnbookmark}
            disabled={removing}
            title="remove bookmark"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2.5 py-1 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-rose-300 hover:text-rose-400 disabled:opacity-40"
          >
            {removing ? '…' : '🔖 remove'}
          </button>
        </div>
      </div>

      {/* body */}
      <p className="text-sm text-[#3d3545] leading-relaxed whitespace-pre-wrap line-clamp-6">
        {post.body}
      </p>

      {/* tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map(t => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${accentRgb}, 0.1)`, color: accent }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BookmarksPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const accent = user?.accentColor || '#c4b5fd'

  useEffect(() => {
    axios.get('/api/posts/bookmarks')
      .then(res => setPosts(res.data.posts || res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleUnbookmark = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}/bookmark`)
      setPosts(prev => prev.filter(p => p.id !== postId))
      showToast('bookmark removed', 'success')
    } catch {
      showToast('could not remove bookmark', 'error')
      throw new Error('failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div
        className="h-0.5 w-full"
        style={{ background: accent }}
      />
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
            bookmarks
          </h1>
          <p className="text-sm text-[#a89bc2] mt-1">posts you've saved for later</p>
        </div>

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔖</p>
            <p className="text-sm text-[#a89bc2]">nothing saved yet — bookmark posts from the discover feed</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                accent={accent}
                onUnbookmark={handleUnbookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
