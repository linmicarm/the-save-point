import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import SeasonBadge from '../components/SeasonBadge'
import Button from '../components/Button'


const MEDIA_TYPES = [
  { key: 'all',    label: 'All',    emoji: '✦' },
  { key: 'book',   label: 'Books',  emoji: '📖' },
  { key: 'movie',  label: 'Movies', emoji: '🎬' },
  { key: 'show',   label: 'Shows',  emoji: '📺' },
  { key: 'music',  label: 'Music',  emoji: '🎵' },
  { key: 'game',   label: 'Games',  emoji: '🎮' },
]

const STATUS_SHELVES = [
  { key: 'want',        label: 'Want to', emoji: '📌' },
  { key: 'in_progress', label: 'In progress', emoji: '▶︎' },
  { key: 'done',        label: 'Done', emoji: '✓' },
]

const TYPE_COLORS = {
  book: '#c4b5fd', movie: '#93c5fd', show: '#86efac', music: '#fdba74', game: '#fda4af',
}

function StarRating({ value, onChange, size = 'sm' }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`${size === 'sm' ? 'text-sm' : 'text-base'} transition-colors`}
          style={{ color: n <= (hover || value || 0) ? '#f59e0b' : '#e4dff0' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange && onChange(n === value ? null : n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function CoverBlock({ entry }) {
  const color = TYPE_COLORS[entry.type] || '#c4b5fd'
  if (entry.coverUrl) {
    return (
      <img
        src={entry.coverUrl}
        alt={entry.title}
        className="w-12 h-16 object-cover rounded-lg shrink-0"
      />
    )
  }
  return (
    <div
      className="w-12 h-16 rounded-lg shrink-0 flex items-center justify-center text-2xl"
      style={{ background: `${color}22` }}
    >
      {MEDIA_TYPES.find(t => t.key === entry.type)?.emoji || '✦'}
    </div>
  )
}

function EntryCard({ entry, accent, onUpdate, onDelete }) {
  const [updating, setUpdating] = useState(false)

  const changeStatus = async (status) => {
    setUpdating(true)
    try {
      await onUpdate(entry.id, { status })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-white border border-[#e4dff0] rounded-2xl p-3 flex gap-3 group hover:border-[#c4b5fd]/40 transition-colors">
      <CoverBlock entry={entry} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#2d2a35] truncate">{entry.title}</p>
            {entry.creator && (
              <p className="text-[11px] text-[#a89bc2] truncate">{entry.creator}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-[10px] text-[#d4cfe3] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
          >
            ✕
          </button>
        </div>

        {entry.status === 'done' && entry.rating > 0 && (
          <StarRating value={entry.rating} size="sm" />
        )}

        {entry.season && (
          <div className="mt-1.5">
            <SeasonBadge season={entry.season} />
          </div>
        )}

        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {entry.tags.map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#f0ebff] text-[#7c6f9b]">{t}</span>
            ))}
          </div>
        )}

        {/* status pills */}
        <div className="flex gap-1 mt-2">
          {STATUS_SHELVES.map(s => (
            <button
              key={s.key}
              onClick={() => changeStatus(s.key)}
              disabled={updating}
              className="text-[9px] px-2 py-0.5 rounded-full border transition-colors disabled:opacity-40"
              style={entry.status === s.key
                ? { background: accent + '22', color: accent, borderColor: accent + '66' }
                : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const ENTRY_DEFAULTS = {
  type: 'book', title: '', creator: '', coverUrl: '',
  status: 'want', rating: null, notes: '', tags: [], tagInput: '',
}

function AddEntryForm({ accent, onAdd, onCancel }) {
  const [form, setForm] = useState(ENTRY_DEFAULTS)
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addTag = () => {
    const t = form.tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    set('tagInput', '')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onAdd({
        type: form.type, title: form.title.trim(), creator: form.creator.trim() || null,
        coverUrl: form.coverUrl.trim() || null, status: form.status,
        rating: form.rating, notes: form.notes.trim() || null, tags: form.tags,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]'

  return (
    <form onSubmit={submit} className="bg-white border border-[#e4dff0] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>add entry</p>
        <button type="button" onClick={onCancel} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
      </div>

      {/* type selector */}
      <div className="flex flex-wrap gap-1.5">
        {MEDIA_TYPES.filter(t => t.key !== 'all').map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => set('type', t.key)}
            className="text-[11px] px-3 py-1 rounded-full border transition-colors"
            style={form.type === t.key
              ? { background: (TYPE_COLORS[t.key] || accent) + '22', color: TYPE_COLORS[t.key] || accent, borderColor: (TYPE_COLORS[t.key] || accent) + '66' }
              : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="title…" className={inputClass} />
      <input value={form.creator} onChange={e => set('creator', e.target.value)} placeholder="author / director / artist…" className={inputClass} />
      <input value={form.coverUrl} onChange={e => set('coverUrl', e.target.value)} placeholder="cover image URL (optional)" className={inputClass} />

      {/* status */}
      <div className="flex gap-1.5">
        {STATUS_SHELVES.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => set('status', s.key)}
            className="text-[11px] px-3 py-1 rounded-full border transition-colors"
            style={form.status === s.key
              ? { background: accent + '22', color: accent, borderColor: accent + '66' }
              : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {form.status === 'done' && (
        <div>
          <p className="text-[10px] text-[#a89bc2] mb-1">rating</p>
          <StarRating value={form.rating} onChange={v => set('rating', v)} size="base" />
        </div>
      )}

      <textarea
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="notes…"
        rows={2}
        className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] resize-none leading-relaxed"
      />

      {/* tags */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0ebff] text-[#7c6f9b] flex items-center gap-1">
              {t}
              <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="opacity-70 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
        <input
          value={form.tagInput}
          onChange={e => set('tagInput', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder="add tag, press Enter"
          className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="quiet" type="button" onClick={onCancel}>cancel</Button>
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="text-xs px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: accent }}
        >
          {saving ? 'adding…' : 'add'}
        </button>
      </div>
    </form>
  )
}

function Shelf({ status, entries, accent, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true)
  const shelf = STATUS_SHELVES.find(s => s.key === status)
  if (!entries.length) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 mb-3 group"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#a89bc2] group-hover:text-[#7c6f9b] transition-colors">
          {shelf?.emoji} {shelf?.label}
        </span>
        <span className="text-[10px] text-[#d4cfe3]">({entries.length})</span>
        <span className="text-[10px] text-[#d4cfe3] transition-transform" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block' }}>▾</span>
      </button>
      {open && (
        <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} accent={accent} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MediaLogPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeSeason, setActiveSeason] = useState(null)

  const accent = user?.accentColor || '#c4b5fd'

  useEffect(() => {
    axios.get('/api/seasons/active')
      .then(r => setActiveSeason(r.data.season || null))
      .catch(() => {})
  }, [])

  const loadEntries = async (type = activeType) => {
    setLoading(true)
    try {
      const params = type !== 'all' ? `?type=${type}` : ''
      const res = await axios.get(`/api/medialog${params}`)
      setEntries(res.data.mediaLogs || [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEntries(activeType) }, [activeType])

  const handleAdd = async (data) => {
    try {
      const res = await axios.post('/api/medialog', { ...data, seasonId: activeSeason?.id || null })
      setEntries(prev => [res.data.entry || res.data, ...prev])
      setShowAddForm(false)
      showToast('entry added', 'success')
    } catch {
      showToast('could not add entry', 'error')
      throw new Error('failed')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      const res = await axios.patch(`/api/medialog/${id}`, data)
      setEntries(prev => prev.map(e => e.id === id ? (res.data.entry || res.data) : e))
    } catch {
      showToast('could not update', 'error')
      throw new Error('failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/medialog/${id}`)
      setEntries(prev => prev.filter(e => e.id !== id))
      showToast('removed', 'success')
    } catch {
      showToast('could not delete', 'error')
    }
  }

  const visible = activeType === 'all' ? entries : entries.filter(e => e.type === activeType)

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
              media log
            </h1>
            <p className="text-sm text-[#a89bc2] mt-1">books, movies, shows, music, games</p>
          </div>
          <Button variant="primary" size="sm" color={accent} onClick={() => setShowAddForm(v => !v)}>+ add entry</Button>
        </div>

        {/* type tabs */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {MEDIA_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className="text-xs px-3.5 py-1.5 rounded-full border transition-colors"
              style={activeType === t.key
                ? { background: accent + '22', color: accent, borderColor: accent + '66' }
                : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* add form */}
        {showAddForm && (
          <div className="mb-6">
            <AddEntryForm accent={accent} onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : visible.length === 0 && !showAddForm ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-sm text-[#a89bc2] mb-6">nothing logged yet</p>
            <Button variant="primary" size="sm" color={accent} onClick={() => setShowAddForm(true)}>add your first entry</Button>
          </div>
        ) : (
          <>
            {STATUS_SHELVES.map(shelf => (
              <Shelf
                key={shelf.key}
                status={shelf.key}
                entries={visible.filter(e => e.status === shelf.key)}
                accent={accent}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
