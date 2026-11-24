import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import Button from '../components/Button'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Single-line prose fields
const PROSE_FIELDS = [
  { key: 'theme',     label: 'theme',     placeholder: 'one word or phrase for this month' },
  { key: 'highlight', label: 'highlight', placeholder: 'the standout moment' },
  { key: 'focus',     label: 'focus',     placeholder: 'what were you working on or building toward?' },
]

// Bullet-list fields
const LIST_FIELDS = [
  { key: 'foods',      label: 'foods & drinks', placeholder: 'add a food or drink...' },
  { key: 'selfCare',   label: 'self-care',       placeholder: 'add a practice...' },
  { key: 'activities', label: 'activities',      placeholder: 'add an activity...' },
  { key: 'media',      label: 'media',           placeholder: 'add something you watched, read, played...' },
  { key: 'other',      label: 'other',           placeholder: 'add anything else...' },
]

const ALL_FIELDS = [...PROSE_FIELDS, ...LIST_FIELDS]

// helpers to convert between string storage and array UI
const toLines = (str) => str ? str.split('\n').filter(Boolean) : []
const fromLines = (arr) => arr.filter(l => l.trim()).join('\n')

function BulletField({ label, value, placeholder, onChange }) {
  const [items, setItems] = useState(() => {
    const lines = toLines(value)
    return lines.length ? lines : ['']
  })
  const inputRefs = useRef([])

  const update = (next) => {
    setItems(next)
    onChange(fromLines(next))
  }

  const setItem = (i, val) => {
    const next = [...items]
    next[i] = val
    update(next)
  }

  const addItem = (afterIndex) => {
    const next = [...items]
    next.splice(afterIndex + 1, 0, '')
    update(next)
    setTimeout(() => inputRefs.current[afterIndex + 1]?.focus(), 0)
  }

  const removeItem = (i) => {
    if (items.length === 1) { update(['']); return }
    const next = items.filter((_, idx) => idx !== i)
    update(next)
    setTimeout(() => inputRefs.current[Math.min(i, next.length - 1)]?.focus(), 0)
  }

  const onKeyDown = (e, i) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(i) }
    if (e.key === 'Backspace' && items[i] === '') { e.preventDefault(); removeItem(i) }
  }

  return (
    <div>
      <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[#c4b5fd] text-xs select-none">•</span>
            <input
              ref={el => inputRefs.current[i] = el}
              value={item}
              onChange={e => setItem(i, e.target.value)}
              onKeyDown={e => onKeyDown(e, i)}
              placeholder={i === 0 ? placeholder : ''}
              className="flex-1 text-sm text-[#5a5065] bg-transparent border-b border-[#ede9f5] focus:border-[#c4b5fd] focus:outline-none py-1 placeholder-[#d4cfe3] transition-colors"
            />
            {(items.length > 1 || item) && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-[#e4dff0] hover:text-rose-300 text-xs transition-colors leading-none"
              >✕</button>
            )}
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-2" type="button" onClick={() => addItem(items.length - 1)}>+ add</Button>
    </div>
  )
}

function MonthModal({ entry, onClose, onSave, onDelete }) {
  const [draft, setDraft]   = useState({ ...entry })
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  const monthLabel = `${MONTH_NAMES[entry.month - 1]} ${entry.year}`
  const hasContent = ALL_FIELDS.some(f => entry[f.key]) || entry.photoUrl

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/months/${entry.id}`, draft)
      onSave(res.data.entry)
    } finally {
      setSaving(false)
    }
  }

  const togglePublic = async () => {
    const res = await axios.patch(`/api/months/${entry.id}`, { isPublic: !draft.isPublic })
    setDraft(d => ({ ...d, isPublic: res.data.entry.isPublic }))
    onSave(res.data.entry)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
      style={{ background: 'rgba(45,42,53,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto modal-sheet"
        onClick={e => e.stopPropagation()}
      >
        {/* handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#e4dff0]" />
        </div>

        <div className="px-6 py-5">
          {/* header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">{entry.mood || '✦'}</span>
                <h2 className="text-lg font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {monthLabel}
                </h2>
              </div>
              {entry.theme && (
                <p className="text-sm text-[#a89bc2] italic ml-8">{entry.theme}</p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={togglePublic}
                className="text-[10px] px-2 py-1 rounded-lg border transition-colors"
                style={draft.isPublic ? {
                  background: '#c4b5fd22', color: 'var(--sp-text-muted)', border: '1px solid #c4b5fd66',
                } : {
                  background: 'transparent', color: 'var(--sp-text-faint)', border: '1px solid var(--sp-border)',
                }}
              >
                {draft.isPublic ? '✦ public' : 'private'}
              </button>
              <button onClick={onClose} className="text-[#c4b8d9] hover:text-[#a89bc2] text-lg leading-none">✕</button>
            </div>
          </div>

          {/* photo */}
          {entry.photoUrl && (
            <button
              type="button"
              onClick={() => setLightbox(entry.photoUrl)}
              className="w-full mb-5 block rounded-xl overflow-hidden group focus:outline-none"
            >
              <img
                src={entry.photoUrl}
                alt={monthLabel}
                className="w-full object-contain group-hover:opacity-95 transition-opacity"
                onError={e => e.target.closest('button').style.display = 'none'}
              />
            </button>
          )}

          {/* read view */}
          {!saving && hasContent && (
            <div className="space-y-4 mb-6">
              {ALL_FIELDS.map(({ key, label }) => entry[key] ? (
                <div key={key}>
                  <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">{label}</p>
                  {LIST_FIELDS.some(f => f.key === key) ? (
                    <ul className="space-y-1">
                      {toLines(entry[key]).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#5a5065]">
                          <span className="text-[#c4b5fd] mt-0.5 shrink-0">•</span>
                          <span className="leading-relaxed">{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#5a5065] leading-relaxed">{entry[key]}</p>
                  )}
                </div>
              ) : null)}
            </div>
          )}

          {/* edit section */}
          <div className="border-t border-[#f0ecfa] pt-5 space-y-4">
            <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider">edit</p>

            {/* mood */}
            <div>
              <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">mood</p>
              <div className="flex items-center gap-2">
                <EmojiPicker
                  value={draft.mood}
                  onChange={e => setDraft(d => ({ ...d, mood: d.mood === e ? null : e }))}
                  placeholder="🌸"
                />
                {draft.mood && (
                  <button onClick={() => setDraft(d => ({ ...d, mood: null }))} className="text-[10px] text-[#c4b8d9] hover:text-rose-300 transition-colors">✕</button>
                )}
              </div>
            </div>

            {/* photo url */}
            <div>
              <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">photo url</p>
              <input
                value={draft.photoUrl || ''}
                onChange={e => setDraft(d => ({ ...d, photoUrl: e.target.value }))}
                placeholder="paste an image URL..."
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
              />
            </div>

            {/* prose fields */}
            {PROSE_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">{label}</p>
                <input
                  value={draft[key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                />
              </div>
            ))}

            {/* bullet list fields */}
            {LIST_FIELDS.map(({ key, label, placeholder }) => (
              <BulletField
                key={key}
                label={label}
                placeholder={placeholder}
                value={draft[key] || ''}
                onChange={val => setDraft(d => ({ ...d, [key]: val }))}
              />
            ))}

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { if (window.confirm('Delete this month entry?')) onDelete(entry.id) }}
                className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors"
              >
                delete
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors"
              >
                {saving ? 'saving...' : 'save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(20,18,26,0.85)' }}
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl leading-none transition-colors">✕</button>
          <img
            src={lightbox}
            alt={monthLabel}
            className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function MonthCard({ month, entry, onClick }) {
  const isEmpty = !entry

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border overflow-hidden transition-all hover:shadow-sm group"
      style={{
        background: isEmpty ? 'var(--sp-bg)' : 'var(--sp-surface)',
        borderColor: 'var(--sp-border-faint)',
      }}
    >
      {entry?.photoUrl && (
        <img
          src={entry.photoUrl}
          alt={MONTH_NAMES[month - 1]}
          className="w-full object-contain"
          onError={e => e.target.style.display = 'none'}
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-medium text-[#2d2a35]">{MONTH_NAMES[month - 1]}</p>
          <span className="text-base leading-none">{entry?.mood || ''}</span>
        </div>
        {entry?.theme ? (
          <p className="text-[11px] text-[#a89bc2] italic line-clamp-2">{entry.theme}</p>
        ) : (
          <p className="text-[11px] text-[#d4cfe3]">{isEmpty ? 'add entry' : 'no theme yet'}</p>
        )}
        {entry?.isPublic && (
          <p className="text-[9px] text-[#c4b5fd] mt-1.5">✦ public</p>
        )}
      </div>
    </button>
  )
}

export default function MonthPage() {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [year, setYear]         = useState(currentYear)
  const [active, setActive]     = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    axios.get('/api/months')
      .then(res => setEntries(res.data.entries))
      .finally(() => setLoading(false))
  }, [])

  const byMonthKey = entries.reduce((acc, e) => {
    acc[`${e.year}-${e.month}`] = e
    return acc
  }, {})

  const openMonth = async (month) => {
    const key = `${year}-${month}`
    if (byMonthKey[key]) {
      setActive(byMonthKey[key])
      return
    }
    // create blank entry
    setCreating(true)
    try {
      const res = await axios.post('/api/months', { year, month })
      const newEntry = res.data.entry
      setEntries(prev => [newEntry, ...prev])
      setActive(newEntry)
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }

  const saveEntry = (updated) => {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setActive(updated)
  }

  const deleteEntry = async (id) => {
    await axios.delete(`/api/months/${id}`)
    setEntries(prev => prev.filter(e => e.id !== id))
    setActive(null)
  }

  const years = [...new Set([currentYear, currentYear - 1, ...entries.map(e => e.year)])].sort((a, b) => b - a)

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your months...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* nav */}
        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </Link>
        </div>

        {/* heading */}
        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          month in review
        </h1>
        <p className="text-sm text-[#a89bc2] mb-6">a slow look back, month by month</p>

        {/* year selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={year === y ? {
                background: '#c4b5fd22', color: 'var(--sp-text-muted)', border: '1px solid #c4b5fd66',
              } : {
                background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', border: '1px solid var(--sp-border-faint)',
              }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* 12-month grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
            const key = `${year}-${month}`
            const isFuture = year === currentYear && month > currentMonth
            return (
              <div key={month} style={{ opacity: isFuture ? 0.4 : 1 }}>
                <MonthCard
                  month={month}
                  year={year}
                  entry={byMonthKey[key] || null}
                  onClick={() => !isFuture && !creating && openMonth(month)}
                />
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>

      {active && (
        <MonthModal
          entry={active}
          onClose={() => setActive(null)}
          onSave={saveEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  )
}
