import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage } from '../utils/uploadImage'
import SectionHeader from './SectionHeader'

const MAX_POST = 300

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)   return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)    return `${d}d ago`
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    ...(d > 365 && { year: 'numeric' }),
  })
}

// ── auto-link URLs in text ────────────────────────────────────────
const URL_RE = /https?:\/\/[^\s]+/g
function Linkified({ text, accent }) {
  const parts = []
  let last = 0, match
  URL_RE.lastIndex = 0
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const url = match[0].replace(/[.,!?)]+$/, '') // strip trailing punctuation
    parts.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer"
        className="underline underline-offset-2 break-all"
        style={{ color: accent }}
        onClick={e => e.stopPropagation()}
      >{url}</a>
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

// ── image grid + lightbox ─────────────────────────────────────────
function ImageGrid({ images }) {
  const [lightbox, setLightbox] = useState(null)
  if (!images?.length) return null
  const count = images.length
  return (
    <>
      <div className={`mt-2.5 gap-1 rounded-2xl overflow-hidden ${
        count === 1 ? 'grid grid-cols-1' :
        count === 2 ? 'grid grid-cols-2' :
        count === 3 ? 'grid grid-cols-2' :
                      'grid grid-cols-2'
      }`}>
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            onClick={() => setLightbox(url)}
            className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
              count === 1 ? 'max-h-80 rounded-2xl' :
              count === 3 && i === 0 ? 'h-48 rounded-tl-2xl rounded-bl-2xl' :
              count === 3 && i === 1 ? 'h-24 rounded-tr-2xl' :
              count === 3 && i === 2 ? 'h-24 rounded-br-2xl' :
              'h-36 first:rounded-tl-2xl first:rounded-bl-2xl last:rounded-tr-2xl last:rounded-br-2xl'
            }`}
          />
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt=""
            className="max-w-[92vw] max-h-[92vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >✕</button>
        </div>
      )}
    </>
  )
}

// ── single post card ──────────────────────────────────────────────
function PostCard({ post, isOwn, authUser, accent, accentRgb, onUpdate, onDelete }) {
  const [showComments, setShowComments]   = useState(false)
  const [comments, setComments]           = useState(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentBody, setCommentBody]     = useState('')
  const [submitting, setSubmitting]       = useState(false)

  const toggleComments = async () => {
    if (!showComments && comments === null) {
      setLoadingComments(true)
      try {
        const res = await axios.get(`/api/posts/${post.id}/comments`)
        setComments(res.data.comments)
      } finally {
        setLoadingComments(false)
      }
    }
    setShowComments(s => !s)
  }

  const toggleLike = async () => {
    if (!authUser) return
    // optimistic
    onUpdate({ ...post, liked: !post.liked, likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1 })
    try {
      await axios.post(`/api/posts/${post.id}/like`)
    } catch {
      onUpdate(post) // revert
    }
  }

  const toggleBookmark = async () => {
    if (!authUser) return
    onUpdate({ ...post, bookmarked: !post.bookmarked })
    try {
      await axios.post(`/api/posts/${post.id}/bookmark`)
    } catch {
      onUpdate(post)
    }
  }

  const submitComment = async () => {
    if (!commentBody.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await axios.post(`/api/posts/${post.id}/comments`, { body: commentBody })
      setComments(prev => [...(prev || []), res.data.comment])
      setCommentBody('')
      onUpdate({ ...post, commentCount: post.commentCount + 1 })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId) => {
    await axios.delete(`/api/posts/comments/${commentId}`)
    setComments(prev => prev.filter(c => c.id !== commentId))
    onUpdate({ ...post, commentCount: post.commentCount - 1 })
  }

  const images = post.images || []

  return (
    <div className="bg-white border rounded-2xl px-4 py-3 group" style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}>

      {/* body */}
      {post.body && (
        <p className="text-sm text-[#2d2a35] leading-relaxed whitespace-pre-wrap break-words">
          <Linkified text={post.body} accent={accent} />
        </p>
      )}

      {/* images */}
      <ImageGrid images={images} />

      {/* action bar */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px]" style={{ color: `rgba(${accentRgb}, 0.4)` }}>
          {timeAgo(post.createdAt)}
        </span>
        <div className="flex items-center gap-4">
          {/* like */}
          <button
            onClick={toggleLike}
            disabled={!authUser}
            className="flex items-center gap-1 transition-all disabled:cursor-default"
            title={authUser ? (post.liked ? 'unlike' : 'like') : 'log in to like'}
          >
            <span className="text-base leading-none transition-transform hover:scale-110"
              style={{ color: post.liked ? '#f87171' : '#d4cfe3' }}>
              {post.liked ? '♥' : '♡'}
            </span>
            {post.likeCount > 0 && (
              <span className="text-[10px]" style={{ color: post.liked ? '#f87171' : '#c4b8d9' }}>
                {post.likeCount}
              </span>
            )}
          </button>

          {/* comment */}
          <button
            onClick={toggleComments}
            className="flex items-center gap-1 transition-colors"
            title="comments"
          >
            <span className="text-sm leading-none" style={{ color: showComments ? accent : '#d4cfe3' }}>💬</span>
            {post.commentCount > 0 && (
              <span className="text-[10px] text-[#c4b8d9]">{post.commentCount}</span>
            )}
          </button>

          {/* bookmark */}
          {authUser && (
            <button
              onClick={toggleBookmark}
              className="text-sm leading-none transition-all hover:scale-110"
              title={post.bookmarked ? 'remove bookmark' : 'bookmark'}
              style={{ color: post.bookmarked ? '#f59e0b' : '#d4cfe3' }}
            >
              {post.bookmarked ? '⊹' : '◇'}
            </button>
          )}

          {/* delete */}
          {isOwn && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-[10px] text-[#e4dff0] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
            >delete</button>
          )}
        </div>
      </div>

      {/* comments section */}
      {showComments && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: `1px solid rgba(${accentRgb}, 0.1)` }}>
          {loadingComments && <p className="text-xs text-[#c4b8d9]">loading...</p>}

          {(comments || []).map(c => (
            <div key={c.id} className="flex gap-2 group/c">
              {/* avatar */}
              {c.user.avatarUrl
                ? <img src={c.user.avatarUrl} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                : <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-medium"
                    style={{ background: c.user.accentColor || '#c4b5fd' }}>
                    {c.user.displayName?.[0]?.toUpperCase()}
                  </div>
              }
              <div className="flex-1 min-w-0 bg-[#faf8ff] rounded-xl px-3 py-2">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-[11px] font-medium text-[#2d2a35]">{c.user.displayName}</span>
                  <span className="text-[10px]" style={{ color: `rgba(${accentRgb}, 0.4)` }}>{timeAgo(c.createdAt)}</span>
                  {(authUser?.username === c.user.username || isOwn) && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-[9px] text-[#e4dff0] hover:text-rose-400 opacity-0 group-hover/c:opacity-100 transition-all ml-auto"
                    >×</button>
                  )}
                </div>
                <p className="text-xs text-[#5a5065] leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}

          {/* comment input */}
          {authUser ? (
            <div className="flex gap-2 pt-0.5">
              {authUser.avatarUrl
                ? <img src={authUser.avatarUrl} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" alt="" />
                : <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-medium mt-0.5"
                    style={{ background: authUser.accentColor || '#c4b5fd' }}>
                    {authUser.displayName?.[0]?.toUpperCase()}
                  </div>
              }
              <input
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                placeholder="write a comment..."
                className="flex-1 text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
              />
            </div>
          ) : (
            <p className="text-[10px] text-[#c4b8d9] italic">log in to comment</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── compose box ───────────────────────────────────────────────────
function ComposeBox({ accent, accentRgb, onPost }) {
  const [body, setBody]               = useState('')
  const [images, setImages]           = useState([])
  const [showGifInput, setShowGifInput] = useState(false)
  const [gifUrl, setGifUrl]           = useState('')
  const [posting, setPosting]         = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)

  // auto-grow
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto'
      textRef.current.style.height = textRef.current.scrollHeight + 'px'
    }
  }, [body])

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    const processed = await Promise.all(files.map(f =>
      f.type === 'image/gif'
        ? new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(f) })
        : uploadImage(f, 'posts', 1000)
    ))
    setImages(prev => [...prev, ...processed])
    e.target.value = ''
  }

  const addGif = () => {
    const url = gifUrl.trim()
    if (url) { setImages(prev => [...prev, url]); setGifUrl(''); setShowGifInput(false) }
  }

  const submit = async () => {
    if ((!body.trim() && !images.length) || body.length > MAX_POST) return
    setPosting(true)
    try {
      const res = await axios.post('/api/posts', {
        body: body.trim(),
        images: images.length ? images : undefined,
      })
      onPost(res.data.post)
      setBody(''); setImages([])
    } finally {
      setPosting(false)
    }
  }

  const remaining = MAX_POST - body.length
  const canPost   = (body.trim() || images.length) && remaining >= 0

  return (
    <div className="mb-5 bg-white border rounded-2xl p-3.5" style={{ borderColor: `rgba(${accentRgb}, 0.2)` }}>
      <textarea
        ref={textRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
        placeholder="what's on your mind?"
        rows={2}
        className="w-full text-sm text-[#2d2a35] placeholder-[#c4b8d9] bg-transparent resize-none focus:outline-none leading-relaxed overflow-hidden"
      />

      {/* image previews */}
      {images.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {images.map((url, i) => (
            <div key={i} className="relative group/img">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl" />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7c6f9b] text-white text-[9px] hidden group-hover/img:flex items-center justify-center shadow-sm"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* gif url input */}
      {showGifInput && (
        <div className="flex gap-2 mt-2">
          <input
            value={gifUrl}
            onChange={e => setGifUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGif(); if (e.key === 'Escape') setShowGifInput(false) }}
            placeholder="paste a GIF or image URL..."
            autoFocus
            className="flex-1 text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
          />
          <button onClick={addGif} className="text-xs px-3 py-1.5 rounded-xl text-white shrink-0" style={{ background: accent }}>add</button>
          <button onClick={() => setShowGifInput(false)} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
        </div>
      )}

      {/* toolbar */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: `1px solid rgba(${accentRgb}, 0.1)` }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[11px] w-7 h-7 rounded-lg flex items-center justify-center text-[#a89bc2] hover:text-[#7c6f9b] hover:bg-[#f5f3ff] transition-colors"
            title="upload photo / GIF"
          >📷</button>
          <button
            onClick={() => setShowGifInput(s => !s)}
            className={`text-[11px] px-2 h-7 rounded-lg font-semibold transition-colors ${showGifInput ? 'text-[#7c6f9b] bg-[#f5f3ff]' : 'text-[#c4b8d9] hover:text-[#7c6f9b] hover:bg-[#f5f3ff]'}`}
            title="add GIF by URL"
          >GIF</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tabular-nums" style={{
            color: remaining < 20 ? (remaining < 0 ? '#f87171' : '#f59e0b') : `rgba(${accentRgb}, 0.35)`
          }}>{remaining}</span>
          <button
            onClick={submit}
            disabled={posting || !canPost}
            className="text-xs px-3.5 py-1.5 rounded-xl text-white disabled:opacity-40 transition-all"
            style={{ background: accent }}
          >{posting ? '...' : 'post'}</button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  )
}

// ── main export ───────────────────────────────────────────────────
export default function UpdatesFeed({ username, isOwn, accent, accentRgb }) {
  const { user: authUser } = useAuth()
  const [posts, setPosts]   = useState([])

  useEffect(() => {
    axios.get(`/api/posts/user/${username}`).then(r => setPosts(r.data.posts)).catch(() => {})
  }, [username])

  const addPost    = (post)    => setPosts(prev => [post, ...prev])
  const updatePost = (updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
  const deletePost = async (id) => {
    await axios.delete(`/api/posts/${id}`)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (!isOwn && posts.length === 0) return null

  return (
    <section>
      <SectionHeader label="updates" accent={accent} accentRgb={accentRgb} />

      {isOwn && <ComposeBox accent={accent} accentRgb={accentRgb} onPost={addPost} />}

      {posts.length === 0 && isOwn && (
        <p className="text-xs text-[#c4b8d9] italic px-1">nothing yet — say something ✦</p>
      )}

      <div className="space-y-2.5">
        {posts.map(p => (
          <PostCard
            key={p.id}
            post={p}
            isOwn={isOwn}
            authUser={authUser}
            accent={accent}
            accentRgb={accentRgb}
            onUpdate={updatePost}
            onDelete={deletePost}
          />
        ))}
      </div>
    </section>
  )
}
