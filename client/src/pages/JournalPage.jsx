import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'
import WeatherCheckIn from '../components/WeatherCheckIn'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function EntryCard({ entry, onDelete, onTogglePublic }) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const preview = entry.body.slice(0, 160)
  const isLong = entry.body.length > 160

  const handleTogglePublic = async (e) => {
    e.stopPropagation()
    setToggling(true)
    try {
      await onTogglePublic(entry.id, !entry.isPublic)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {entry.mood && <span className="text-lg">{entry.mood}</span>}
          {entry.season && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${entry.season.color}22`, color: entry.season.color }}
            >
              {entry.season.emoji} {entry.season.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTogglePublic}
            disabled={toggling}
            title={entry.isPublic ? 'visible on your profile — click to make private' : 'private — click to share on profile'}
            className="text-xs transition-colors disabled:opacity-40"
            style={{ color: entry.isPublic ? '#a89bc2' : '#d4cfe3' }}
          >
            {entry.isPublic ? '🌐' : '🔒'}
          </button>
          <span className="text-xs text-[#c4b8d9]">{formatDate(entry.createdAt)}</span>
          <DeleteButton onDelete={() => onDelete(entry.id)} label="✕" className="text-xs text-[#d4cfe3] hover:text-rose-300 transition-colors" />
        </div>
      </div>

      {entry.prompt && (
        <p className="text-xs text-[#a89bc2] italic mb-2 border-l-2 border-[#e4dff0] pl-2">
          {entry.prompt}
        </p>
      )}

      <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">
        {expanded || !isLong ? entry.body : `${preview}...`}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-[#a89bc2] hover:text-[#7c6f9b] mt-2 transition-colors"
        >
          {expanded ? 'show less' : 'read more'}
        </button>
      )}
    </div>
  )
}

export default function JournalPage() {
  const { user } = useAuth()

  const [prompt, setPrompt]     = useState('')
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [body, setBody]         = useState('')
  const [mood, setMood]         = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [usePrompt, setUsePrompt] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

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
        body,
        mood: mood || null,
        prompt: usePrompt ? prompt : null,
        isPublic,
      })
      setEntries(prev => [res.data.entry, ...prev])
      setBody('')
      setMood('')
      setIsPublic(false)
      setUsePrompt(false)
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
    } catch {
      console.error('delete failed')
    }
  }

  const handleTogglePublic = async (id, newValue) => {
    try {
      await axios.patch(`/api/journal/${id}`, { isPublic: newValue })
      setEntries(prev => prev.map(e => e.id === id ? { ...e, isPublic: newValue } : e))
    } catch {
      console.error('toggle failed')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your journal...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* nav */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to={`/u/${user.username}`}
            className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors"
          >
            ← your page
          </Link>
          <p className="text-xs text-[#c4b8d9]">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* heading */}
        <h1
          className="text-2xl font-medium text-[#2d2a35] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          your journal
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">private, always</p>

        {/* weather check-in */}
        <WeatherCheckIn />

        {/* daily prompt */}
        <div
          className="rounded-2xl p-4 mb-6 cursor-pointer border transition-colors"
          style={{
            background: usePrompt ? '#c4b5fd18' : '#faf8ff',
            borderColor: usePrompt ? '#c4b5fd66' : '#e4dff0',
          }}
          onClick={() => setUsePrompt(u => !u)}
        >
          <p className="text-xs font-medium text-[#a89bc2] uppercase tracking-widest mb-1.5">
            today's prompt
          </p>
          <p className="text-sm text-[#5a5065] leading-relaxed italic">
            "{prompt}"
          </p>
          <p className="text-xs text-[#c4b8d9] mt-2">
            {usePrompt ? '✓ writing to this prompt' : 'tap to write to this prompt'}
          </p>
        </div>

        {/* write area */}
        <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-8">
          {usePrompt && (
            <p className="text-xs text-[#a89bc2] italic mb-3 border-l-2 border-[#c4b5fd] pl-2">
              {prompt}
            </p>
          )}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="what's on your mind today..."
            rows={5}
            className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none resize-none placeholder-[#c4b8d9] leading-relaxed"
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0ecfa]">
            {/* mood picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#c4b8d9]">mood</span>
              <EmojiPicker
                value={mood}
                onChange={(e) => setMood(prev => prev === e ? '' : e)}
                placeholder="🌸"
              />
              {mood && (
                <button onClick={() => setMood('')} className="text-[10px] text-[#c4b8d9] hover:text-rose-300 transition-colors">✕</button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="button"
                onClick={() => setIsPublic(p => !p)}
                title={isPublic ? 'public — visible on your profile' : 'private — only you can see this'}
                className="text-xs px-2.5 py-1.5 rounded-xl border transition-colors"
                style={isPublic
                  ? { borderColor: '#c4b5fd', color: '#7c6f9b', background: '#c4b5fd18' }
                  : { borderColor: '#e4dff0', color: '#c4b8d9', background: 'transparent' }
                }
              >
                {isPublic ? '🌐 public' : '🔒 private'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !body.trim()}
                className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] hover:bg-[#b39ef7] text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'saving...' : 'save entry'}
              </button>
            </div>
          </div>
        </div>

        {/* entries */}
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#c4b8d9]">your first entry is waiting to be written</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} onTogglePublic={handleTogglePublic} />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
