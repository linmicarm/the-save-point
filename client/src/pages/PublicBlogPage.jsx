import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import BackLink from '../components/BackLink'

const MOOD_EMOJIS = {
  inspired: '✨', soft: '🌸', happy: '😊', tender: '🥺', melancholy: '😔',
  frustrated: '😤', dreamy: '🌙', cozy: '☕', passionate: '🔥', peaceful: '😌',
  reflective: '🤔', excited: '🎉', tired: '😴', heartbroken: '💔', grounded: '🌿', electric: '⚡',
}

function excerpt(content, maxLen = 180) {
  if (!Array.isArray(content)) return ''
  const text = content.filter(b => b.type === 'text').map(b => b.value).join(' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '…' : text
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PublicBlogPage() {
  const { username } = useParams()
  const [posts, setPosts]     = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get(`/api/users/${username}`),
      axios.get(`/api/blog/user/${username}`),
    ])
      .then(([userRes, blogRes]) => {
        setProfile(userRes.data.user)
        setPosts(blogRes.data.posts)
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">user not found</p>
    </div>
  )

  const accent = profile?.accentColor || '#c4b5fd'
  const r = parseInt(accent.slice(1,3),16), g = parseInt(accent.slice(3,5),16), b = parseInt(accent.slice(5,7),16)
  const accentRgb = `${r}, ${g}, ${b}`

  return (
    <div className="min-h-screen" style={{ background: `rgba(${accentRgb}, 0.03)` }}>
      <div className="h-1" style={{ background: accent }} />
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* header */}
        <div className="mb-10">
          <BackLink to={`/u/${username}`} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors block mb-3">
            ← {profile?.displayName}'s profile
          </BackLink>
          <h1 className="text-3xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
            {profile?.displayName}'s blog
          </h1>
          {profile?.bio && (
            <p className="text-sm text-[#7c6f9b] mt-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">✦</p>
            <p className="text-sm text-[#a89bc2]">no posts yet</p>
          </div>
        )}

        <div className="space-y-6">
          {posts.map(post => {
            const moodEmoji = post.mood ? (MOOD_EMOJIS[post.mood] || null) : null
            const firstImage = post.content?.find(b => b.type === 'image' && b.url)
            const coverImg = post.coverUrl || firstImage?.url

            return (
              <article key={post.id}>
                <Link to={`/u/${username}/blog/${post.slug}`} className="block group">
                  {coverImg && (
                    <div className="rounded-2xl overflow-hidden mb-3" style={{ height: '200px' }}>
                      <img src={coverImg} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-medium text-[#2d2a35] group-hover:text-[#7c6f9b] transition-colors leading-snug mb-1.5"
                        style={{ fontFamily: 'var(--font-serif)' }}>
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-[#c4b8d9] mb-2 flex-wrap">
                        <span>{formatDate(post.createdAt)}</span>
                        {moodEmoji && <span>· {moodEmoji} {post.mood}</span>}
                        {post.music && <span>· 🎵 {post.music}</span>}
                        {post._count?.comments > 0 && (
                          <span>· {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      {excerpt(post.content) && (
                        <p className="text-sm text-[#7c6f9b] leading-relaxed line-clamp-3">
                          {excerpt(post.content)}
                        </p>
                      )}
                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {post.tags.map(t => (
                            <span key={t} className="text-[10px] text-[#a89bc2]">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="mt-4 h-px" style={{ background: `rgba(${accentRgb}, 0.1)` }} />
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
