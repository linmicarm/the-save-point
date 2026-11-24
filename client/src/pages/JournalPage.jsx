import { useEffect, useState } from 'react'

import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'
import WeatherCheckIn from '../components/WeatherCheckIn'
import BackLink from '../components/BackLink'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function EntryCard({ entry, onDelete, onTogglePublic }) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const preview = entry.body.slice(0, 200)
  const isLong  = entry.body.length > 200

  const handleTogglePublic = async (e) => {
    e.stopPropagation()
    setToggling(true)
    try { await onTogglePublic(entry.id, !entry.isPublic) }
    finally { setToggling(false) }
  }

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
        boxShadow: '0 1px 6px rgba(59,47,47,0.04)' }}>

      {/* top row — mood + season + meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {entry.mood && <span className="text-xl leading-none">{entry.mood}</span>}
          {entry.season && (
            <span className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: `${entry.season.color}22`, color: entry.season.color }}>
              {entry.season.emoji} {entry.season.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleTogglePublic} disabled={toggling}
            title={entry.isPublic ? 'visible on profile — click to make private' : 'private — click to share'}
            className="text-sm transition-opacity hover:opacity-70 disabled:opacity-40">
            {entry.isPublic ? '🌐' : '🔒'}
          </button>
          <span className="text-[11px] shrink-0"
            style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
            {formatDate(entry.createdAt)}
          </span>
          <DeleteButton onDelete={() => onDelete(entry.id)} label="✕" />
        </div>
      </div>

      {/* prompt */}
      {entry.prompt && (
        <p className="text-xs italic mb-3 pl-3"
          style={{ color: 'var(--sp-text-faint)', borderLeft: '2px solid var(--sp-border)' }}>
          {entry.prompt}
        </p>
      )}

      {/* body — Lora for that handwritten-prose feel */}
      <p className="leading-relaxed whitespace-pre-wrap"
        style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem', color: 'var(--sp-text-muted)' }}>
        {expanded || !isLong ? entry.body : `${preview}…`}
      </p>

      {isLong && (
        <button onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs transition-colors"
          style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
          {expanded ? 'show less' : 'read more →'}
        </button>
      )}
    </div>
  )
}

export default function JournalPage() {
  const { user } = useAuth()

  const [prompt, setPrompt]       = useState('')
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [body, setBody]           = useState('')
  const [mood, setMood]           = useState('')
  const [isPublic, setIsPublic]   = useState(false)
  const [usePrompt, setUsePrompt] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    Promise.all([
      axios.get('/api/journal/prompt'),
      axios.get('/api/journal'),
    ]).then(([promptRes, entriesRes]) => {
      setPrompt(promptRes.data.prompt)
      setEntries(entriesRes.data.entries)
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!body.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await axios.post('/api/journal', {
        body, mood: mood || null,
        prompt: usePrompt ? prompt : null,
        isPublic,
      })
      setEntries(prev => [res.data.entry, ...prev])
      setBody(''); setMood(''); setIsPublic(false); setUsePrompt(false)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/journal/${id}`)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { /* ignore */ }
  }

  const handleTogglePublic = async (id, newValue) => {
    try {
      await axios.patch(`/api/journal/${id}`, { isPublic: newValue })
      setEntries(prev => prev.map(e => e.id === id ? { ...e, isPublic: newValue } : e))
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sp-bg)' }}>
      <p className="text-sm" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
        loading your journal…
      </p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--sp-bg)' }}>
      {/* accent top stripe */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #c4b5fd, #a78bfa)' }} />

      <div className="max-w-lg mx-auto px-5 py-10">

        {/* breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <BackLink to={`/u/${user.username}`}
            className="text-xs transition-colors"
            style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
            ← your page
          </BackLink>
          <p className="text-xs" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* heading */}
        <h1 className="mb-1 leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem',
            letterSpacing: '-0.03em', color: 'var(--sp-text)' }}>
          your journal
        </h1>
        <p className="mb-8" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)', fontSize: '0.95rem' }}>
          private, always ✦
        </p>

        {/* weather check-in */}
        <WeatherCheckIn />

        {/* daily prompt */}
        <div className="rounded-2xl p-4 mb-6 cursor-pointer transition-all"
          style={{
            background: usePrompt ? 'rgba(196,181,253,0.1)' : 'var(--sp-surface)',
            border: `1px solid ${usePrompt ? 'rgba(196,181,253,0.5)' : 'var(--sp-border)'}`,
          }}
          onClick={() => setUsePrompt(u => !u)}>
          <p className="text-[11px] mb-1.5 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
            today's prompt
          </p>
          <p className="text-sm leading-relaxed italic"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
            "{prompt}"
          </p>
          <p className="text-xs mt-2" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>
            {usePrompt ? '✓ writing to this prompt' : 'tap to write to this prompt'}
          </p>
        </div>

        {/* write area */}
        <div className="rounded-2xl p-5 mb-8"
          style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
            boxShadow: '0 2px 12px rgba(59,47,47,0.04)' }}>

          {usePrompt && (
            <p className="text-xs italic mb-3 pl-3"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-faint)',
                borderLeft: '2px solid rgba(196,181,253,0.4)' }}>
              {prompt}
            </p>
          )}

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="what's on your mind today…"
            rows={5}
            className="w-full bg-transparent focus:outline-none resize-none leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
              color: 'var(--sp-text)', caretColor: '#c4b5fd' }}
          />

          <div className="flex items-center justify-between mt-4 pt-4"
            style={{ borderTop: '1px solid var(--sp-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}>mood</span>
              <EmojiPicker value={mood} onChange={(e) => setMood(prev => prev === e ? '' : e)} placeholder="🌸" />
              {mood && (
                <button onClick={() => setMood('')}
                  className="text-[10px] transition-colors hover:text-rose-300"
                  style={{ color: 'var(--sp-text-faint)' }}>✕</button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button type="button" onClick={() => setIsPublic(p => !p)}
                title={isPublic ? 'public' : 'private'}
                className="text-xs px-2.5 py-1.5 rounded-xl border transition-all"
                style={isPublic
                  ? { borderColor: 'rgba(196,181,253,0.5)', color: 'var(--sp-text-muted)', background: 'rgba(196,181,253,0.1)' }
                  : { borderColor: 'var(--sp-border)', color: 'var(--sp-text-faint)' }}>
                {isPublic ? '🌐 public' : '🔒 private'}
              </button>
              <button onClick={handleSave} disabled={saving || !body.trim()}
                className="text-xs px-4 py-2 rounded-xl text-white transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
                  fontFamily: 'var(--font-display)', fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(167,139,250,0.3)' }}>
                {saving ? 'saving…' : 'save entry'}
              </button>
            </div>
          </div>
        </div>

        {/* entries list */}
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)', fontSize: '1rem' }}>
              your first entry is waiting to be written ✦
            </p>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry}
                onDelete={handleDelete}
                onTogglePublic={handleTogglePublic} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
