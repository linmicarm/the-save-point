import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import BackLink from '../components/BackLink'

const MOOD_EMOJIS = {
  inspired: '✨', soft: '🌸', happy: '😊', tender: '🥺', melancholy: '😔',
  frustrated: '😤', dreamy: '🌙', cozy: '☕', passionate: '🔥', peaceful: '😌',
  reflective: '🤔', excited: '🎉', tired: '😴', heartbroken: '💔', grounded: '🌿', electric: '⚡',
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function CommentSection({ postId, accent, accentRgb }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [comments, setComments] = useState([])
  const [body, setBody]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [, setLoaded]            = useState(false)

  useEffect(() => {
    axios.get(`/api/blog/${postId}/comments`)
      .then(res => { setComments(res.data.comments); setLoaded(true) })
      .catch(() => {})
  }, [postId])

  const submit = async () => {
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const res = await axios.post(`/api/blog/${postId}/comments`, { body })
      setComments(cs => [...cs, res.data.comment])
      setBody('')
    } catch {
      showToast('could not post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (cid) => {
    try {
      await axios.delete(`/api/blog/comments/${cid}`)
      setComments(cs => cs.filter(c => c.id !== cid))
    } catch {
      showToast('could not delete')
    }
  }

  return (
    <div className="mt-12 pt-8 border-t-2" style={{ borderColor: `rgba(${accentRgb}, 0.12)` }}>
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: accent }}>
        ✦ {comments.length} comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {/* comment form */}
      {user ? (
        <div className="mb-8 flex gap-3">
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs overflow-hidden"
            style={{ background: user.accentColor || '#c4b5fd' }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
              : user.displayName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="leave a comment..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-[#e4dff0] bg-white text-sm text-[#3d3545] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submit}
                disabled={submitting || !body.trim()}
                className="text-xs px-4 py-1.5 rounded-full text-white disabled:opacity-40 transition-opacity"
                style={{ background: accent }}
              >{submitting ? 'posting…' : 'post'}</button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#a89bc2] mb-8">
          <Link to="/login" className="underline hover:text-[#5a5065] transition-colors">sign in</Link> to leave a comment
        </p>
      )}

      {/* comments list */}
      <div className="space-y-5">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 group">
            <Link to={`/u/${c.user.username}`}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs overflow-hidden"
                style={{ background: c.user.accentColor || '#c4b5fd' }}>
                {c.user.avatarUrl
                  ? <img src={c.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                  : c.user.displayName?.[0]?.toUpperCase()}
              </div>
            </Link>
            <div className="flex-1 bg-[#faf8ff] border border-[#e4dff0] rounded-2xl px-4 py-3">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <Link to={`/u/${c.user.username}`} className="text-xs font-medium text-[#5a5065] hover:text-[#2d2a35] transition-colors">
                  {c.user.displayName}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#c4b8d9]">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {user && (user.username === c.user.username) && (
                    <button onClick={() => deleteComment(c.id)}
                      className="text-[10px] text-[#c4b8d9] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                      delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#5a5065] leading-relaxed">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BlogPostPage() {
  const { username, slug } = useParams()
  const { user } = useAuth()
  const [post, setPost]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios.get(`/api/blog/user/${username}/${slug}`)
      .then(res => setPost(res.data.post))
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [username, slug])

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  if (notFound || !post) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center">
        <p className="text-3xl mb-3">✦</p>
        <p className="text-sm text-[#a89bc2]">post not found</p>
        <BackLink to={`/u/${username}`} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] mt-4 block">← back to profile</BackLink>
      </div>
    </div>
  )

  const accent    = post.user.accentColor || '#c4b5fd'
  const r = parseInt(accent.slice(1,3),16), g = parseInt(accent.slice(3,5),16), b = parseInt(accent.slice(5,7),16)
  const accentRgb = `${r}, ${g}, ${b}`
  const moodEmoji = post.mood ? (MOOD_EMOJIS[post.mood] || '✦') : null

  return (
    <div className="min-h-screen" style={{ background: `rgba(${accentRgb}, 0.03)` }}>
      <div className="h-1" style={{ background: accent }} />

      {/* cover */}
      {post.coverUrl && (
        <div className="w-full max-h-[420px] overflow-hidden">
          <img src={post.coverUrl} alt="" className="w-full object-cover" style={{ maxHeight: '420px' }} />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* back link */}
        <BackLink to={`/u/${username}/blog`} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors mb-8 block">
          ← {post.user.displayName}'s blog
        </BackLink>

        {/* meta row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link to={`/u/${username}`}>
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs shrink-0"
              style={{ background: post.user.avatarUrl ? 'transparent' : accent }}>
              {post.user.avatarUrl
                ? <img src={post.user.avatarUrl} className="w-full h-full object-cover" alt="" />
                : post.user.displayName?.[0]?.toUpperCase()}
            </div>
          </Link>
          <Link to={`/u/${username}`} className="text-xs text-[#a89bc2] hover:text-[#5a5065] transition-colors">
            {post.user.displayName}
          </Link>
          <span className="text-[#e4dff0]">·</span>
          <span className="text-xs text-[#c4b8d9]">{formatDate(post.createdAt)}</span>
          {moodEmoji && (
            <>
              <span className="text-[#e4dff0]">·</span>
              <span className="text-xs text-[#a89bc2]">{moodEmoji} {post.mood}</span>
            </>
          )}
          {post.music && (
            <>
              <span className="text-[#e4dff0]">·</span>
              <span className="text-xs text-[#a89bc2]">🎵 {post.music}</span>
            </>
          )}
          {user?.username === username && (
            <Link to={`/blog/edit/${post.id}`} className="text-[11px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors ml-auto">edit</Link>
          )}
        </div>

        {/* title */}
        <h1 className="text-3xl font-medium text-[#2d2a35] leading-snug mb-8"
          style={{ fontFamily: 'var(--font-serif)' }}>
          {post.title}
        </h1>

        {/* content blocks */}
        <div className="space-y-5">
          {(post.content || []).map((block, i) => {
            if (block.type === 'image') return (
              <figure key={i} className="my-6">
                <img src={block.url} alt={block.caption} className="w-full rounded-2xl object-contain max-h-[600px]" />
                {block.caption && (
                  <figcaption className="text-center text-xs text-[#a89bc2] mt-2 italic">{block.caption}</figcaption>
                )}
              </figure>
            )
            return block.value ? (
              <p key={i} className="text-[15px] text-[#3d3545] leading-[1.85] whitespace-pre-wrap">
                {block.value}
              </p>
            ) : null
          })}
        </div>

        {/* tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-10 pt-6 border-t border-[#e4dff0]">
            {post.tags.map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-white border text-[#7c6f9b]"
                style={{ borderColor: `rgba(${accentRgb}, 0.2)` }}>
                #{t}
              </span>
            ))}
          </div>
        )}

        <CommentSection postId={post.id} accent={accent} accentRgb={accentRgb} />
      </div>
    </div>
  )
}
