import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import BackLink from '../components/BackLink'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { showToast } = useToast()
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/blog')
      .then(res => setPosts(res.data.posts))
      .catch(() => showToast('could not load posts'))
      .finally(() => setLoading(false))
  }, [])

  const deletePost = async (id) => {
    if (!confirm('delete this post?')) return
    try {
      await axios.delete(`/api/blog/${id}`)
      setPosts(ps => ps.filter(p => p.id !== id))
      showToast('post deleted')
    } catch {
      showToast('could not delete')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <BackLink to={`/u/${user?.username}`} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors block mb-1">← profile</BackLink>
            <h1 className="text-2xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>my blog</h1>
          </div>
          <button
            onClick={() => navigate('/blog/new')}
            className="text-sm px-4 py-2 rounded-full text-white"
            style={{ background: '#c4b5fd' }}
          >+ write</button>
        </div>

        {loading && <p className="text-sm text-[#a89bc2]">loading...</p>}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✦</p>
            <p className="text-[#a89bc2] text-sm mb-6">no posts yet — write your first entry</p>
            <button onClick={() => navigate('/blog/new')}
              className="text-sm px-5 py-2.5 rounded-full text-white" style={{ background: '#c4b5fd' }}>
              start writing
            </button>
          </div>
        )}

        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id}
              className="group flex items-start gap-4 bg-white border border-[#e4dff0] rounded-2xl px-4 py-3.5 hover:border-[#c4b5fd] transition-colors">
              {post.coverUrl && (
                <img src={post.coverUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/blog/edit/${post.id}`} className="text-sm font-medium text-[#2d2a35] hover:text-[#7c6f9b] transition-colors leading-snug line-clamp-1">
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/blog/edit/${post.id}`} className="text-[11px] text-[#a89bc2] hover:text-[#5a5065] transition-colors">edit</Link>
                    <button onClick={() => deletePost(post.id)} className="text-[11px] text-[#c4b8d9] hover:text-rose-400 transition-colors">delete</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-[#c4b8d9]">{timeAgo(post.createdAt)}</span>
                  {post.mood && <span className="text-[10px] text-[#a89bc2]">· {post.mood}</span>}
                  {post._count?.comments > 0 && (
                    <span className="text-[10px] text-[#c4b8d9]">· {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}</span>
                  )}
                  {post.isPublic
                    ? <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f0ebff] text-[#7c6f9b]">public</span>
                    : <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#c4b8d9]">draft</span>
                  }
                </div>
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {post.tags.map(t => (
                      <span key={t} className="text-[9px] text-[#a89bc2]">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
