import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const FIELDS = [
  { key: 'focus',    label: 'focused on',   placeholder: 'what has most of your attention right now?' },
  { key: 'building', label: 'building',     placeholder: 'what are you creating or working toward?' },
  { key: 'learning', label: 'learning',     placeholder: 'what are you studying or getting better at?' },
  { key: 'feeling',  label: 'feeling',      placeholder: 'how would you describe where you are emotionally?' },
  { key: 'location', label: 'based in',     placeholder: 'where in the world are you?' },
]

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'updated today'
  if (days === 1) return 'updated yesterday'
  if (days < 30) return `updated ${days} days ago`
  const months = Math.floor(days / 30)
  return `updated ${months} month${months > 1 ? 's' : ''} ago`
}

function PublicNowPage({ username }) {
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios.get(`/api/now/public/${username}`)
      .then(res => setEntry(res.data.entry))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center">
        <p className="text-3xl mb-3">✦</p>
        <p className="text-sm text-[#a89bc2]">this now page is private</p>
        <Link to={`/u/${username}`} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors mt-3 block">
          ← {username}'s page
        </Link>
      </div>
    </div>
  )

  const filled = FIELDS.filter(f => entry[f.key])

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← {username}'s page
          </Link>
          {entry.updatedAt && (
            <p className="text-[10px] text-[#c4b8d9]">{timeAgo(entry.updatedAt)}</p>
          )}
        </div>

        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>now</h1>
        <p className="text-sm text-[#a89bc2] mb-8">a snapshot of where {username} is right now</p>

        {filled.length === 0 ? (
          <p className="text-sm text-[#c4b8d9] italic">nothing here yet</p>
        ) : (
          <div className="space-y-5">
            {filled.map(({ key, label }) => (
              <div key={key}>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">{label}</p>
                <p className="text-sm text-[#5a5065] leading-relaxed">{entry[key]}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}

export default function NowPage() {
  const { username } = useParams()
  const { user } = useAuth()

  const isPublicView = username && username !== user?.username

  if (isPublicView) return <PublicNowPage username={username} />

  return <EditNowPage user={user} />
}

function EditNowPage({ user }) {
  const { showToast } = useToast()
  const [entry, setEntry]   = useState(null)
  const [draft, setDraft]   = useState({ focus: '', building: '', learning: '', feeling: '', location: '', isPublic: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    axios.get('/api/now')
      .then(res => {
        if (res.data.entry) {
          setEntry(res.data.entry)
          setDraft(res.data.entry)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.put('/api/now', draft)
      setEntry(res.data.entry)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const togglePublic = async () => {
    const next = !draft.isPublic
    setDraft(d => ({ ...d, isPublic: next }))
    try {
      const res = await axios.put('/api/now', { ...draft, isPublic: next })
      setEntry(res.data.entry)
    } catch {
      setDraft(d => ({ ...d, isPublic: !next }))
      showToast('could not update visibility — try again')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</Link>
          <div className="flex items-center gap-3">
            {entry?.updatedAt && <p className="text-[10px] text-[#c4b8d9]">{timeAgo(entry.updatedAt)}</p>}
            <button
              onClick={togglePublic}
              className="text-[10px] px-2.5 py-1 rounded-lg border transition-colors"
              style={draft.isPublic ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' } : { background: 'transparent', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
            >
              {draft.isPublic ? '✦ public' : 'private'}
            </button>
          </div>
        </div>

        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>now</h1>
        <p className="text-sm text-[#a89bc2] mb-8">a snapshot of where you are right now</p>

        <div className="space-y-5">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">{label}</p>
              <textarea
                value={draft[key] || ''}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={2}
                className="w-full text-sm text-[#5a5065] bg-white border border-[#e4dff0] rounded-2xl px-4 py-3 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#d4cfe3] leading-relaxed"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={save} disabled={saving}
            className="text-xs px-5 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
            {saving ? 'saving...' : saved ? '✓ saved' : 'save'}
          </button>
        </div>

        {draft.isPublic && (
          <p className="text-center text-[10px] text-[#c4b8d9] mt-4">
            shareable at <span className="text-[#a89bc2]">savepoint.app/u/{user.username}/now</span>
          </p>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
