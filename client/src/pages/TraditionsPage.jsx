import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'
import Button from '../components/Button'

const PRESET_HOLIDAYS = [
  { name: "Christmas",        emoji: "🎄" },
  { name: "Thanksgiving",     emoji: "🍂" },
  { name: "New Year's Eve",   emoji: "🥂" },
  { name: "New Year's Day",   emoji: "✨" },
  { name: "Easter",           emoji: "🌸" },
  { name: "Halloween",        emoji: "🎃" },
  { name: "Eid al-Fitr",      emoji: "🌙" },
  { name: "Eid al-Adha",      emoji: "🌙" },
  { name: "Diwali",           emoji: "🪔" },
  { name: "Kwanzaa",          emoji: "🕯️" },
  { name: "Lunar New Year",   emoji: "🧧" },
  { name: "Hanukkah",         emoji: "🕎" },
  { name: "Juneteenth",       emoji: "✊🏾" },
  { name: "Mother's Day",     emoji: "💐" },
  { name: "Father's Day",     emoji: "🌿" },
  { name: "Valentine's Day",  emoji: "🌹" },
  { name: "Fourth of July",   emoji: "🎆" },
  { name: "Passover",         emoji: "✡️" },
  { name: "Ramadan",          emoji: "☪️" },
  { name: "Yom Kippur",       emoji: "🕍" },
  { name: "Día de Muertos",   emoji: "🌺" },
  { name: "Midsummer",        emoji: "🌞" },
]

const getEmoji = (name) => PRESET_HOLIDAYS.find(h => h.name === name)?.emoji || '✦'

const FIELDS = [
  { key: 'celebration', label: 'how you celebrated', placeholder: 'what did you do? where did you go?', rows: 3 },
  { key: 'food',        label: 'what you ate & drank', placeholder: 'the foods and drinks that made it special', rows: 2 },
  { key: 'people',      label: 'who you were with',    placeholder: 'the people who shared it with you', rows: 2 },
  { key: 'changes',     label: 'would you change anything?', placeholder: 'what would you do differently, or keep exactly the same?', rows: 2 },
]

function EntryCard({ entry, onUpdate, onDelete, onPhotoClick }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...entry })
  const [saving, setSaving]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/traditions/${entry.id}`, draft)
      onUpdate(res.data.entry)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft({ ...entry })
    setEditing(false)
  }

  const hasContent = entry.celebration || entry.food || entry.people || entry.changes

  return (
    <div className="border border-[#ede9f5] rounded-2xl overflow-hidden bg-white">
      {/* photo */}
      {entry.photoUrl && (
        <button
          type="button"
          onClick={() => onPhotoClick(entry.photoUrl)}
          className="w-full block overflow-hidden focus:outline-none group"
        >
          <img
            src={entry.photoUrl}
            alt={entry.holidayName}
            className="w-full object-contain group-hover:opacity-95 transition-opacity"
            onError={e => e.target.closest('button').style.display = 'none'}
          />
        </button>
      )}

      {/* header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f2fc]">
        <span className="text-lg">{entry.mood || '✦'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#2d2a35] truncate">
            {entry.title || `${entry.holidayName} ${entry.year}`}
          </p>
          {entry.title && (
            <p className="text-[11px] text-[#c4b8d9]">{entry.year}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setExpanded(e => !e); setEditing(false) }} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors">
            {expanded ? '▲' : '▼'}
          </button>
          <Button variant="secondary" size="sm" onClick={() => { setExpanded(true); setEditing(true) }}>edit</Button>
          <DeleteButton onDelete={() => onDelete(entry.id)} label="✕" className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
        </div>
      </div>

      {/* preview line */}
      {!expanded && entry.celebration && (
        <p className="px-4 py-3 text-sm text-[#5a5065] line-clamp-2 leading-relaxed">{entry.celebration}</p>
      )}

      {!expanded && !hasContent && (
        <p className="px-4 py-3 text-sm text-[#c4b8d9] italic">no notes yet</p>
      )}

      {/* expanded */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 bg-[#faf8ff]">
          {editing ? (
            <>
              {/* mood */}
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">mood</p>
                <div className="flex items-center gap-2">
                  <EmojiPicker
                    value={draft.mood}
                    onChange={(e) => setDraft(d => ({ ...d, mood: d.mood === e ? null : e }))}
                    placeholder="🌸"
                  />
                  {draft.mood && (
                    <button onClick={() => setDraft(d => ({ ...d, mood: null }))} className="text-[10px] text-[#c4b8d9] hover:text-rose-300 transition-colors">✕</button>
                  )}
                </div>
              </div>

              {/* caption */}
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">caption</p>
                <input
                  value={draft.title || ''}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder={`${entry.holidayName} ${entry.year}`}
                  className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                />
              </div>

              {/* photo url */}
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">photo url</p>
                <input
                  value={draft.photoUrl || ''}
                  onChange={e => setDraft(d => ({ ...d, photoUrl: e.target.value }))}
                  placeholder="paste an image URL..."
                  className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                />
              </div>

              {FIELDS.map(({ key, label, placeholder, rows }) => (
                <div key={key}>
                  <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">{label}</p>
                  <textarea
                    value={draft[key] || ''}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full text-sm text-[#5a5065] bg-white border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'saving...' : 'save'}
                </button>
                <Button variant="quiet" onClick={cancel}>cancel</Button>
              </div>
            </>
          ) : (
            <>
              {FIELDS.map(({ key, label }) => entry[key] ? (
                <div key={key}>
                  <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">{entry[key]}</p>
                </div>
              ) : null)}
              {!hasContent && (
                <p className="text-sm text-[#c4b8d9] italic text-center py-2">
                  nothing written yet — click edit to record this memory
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function TraditionsPage() {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()

  const [grouped, setGrouped]         = useState({})
  const [loading, setLoading]         = useState(true)
  const [activeHoliday, setActiveHoliday] = useState(null)
  const [showPicker, setShowPicker]   = useState(false)
  const [customHoliday, setCustomHoliday] = useState('')
  const [newYear, setNewYear]         = useState(currentYear)
  const [creating, setCreating]       = useState(false)
  const [lightbox, setLightbox]       = useState(null)

  useEffect(() => {
    axios.get('/api/traditions')
      .then(res => {
        setGrouped(res.data.grouped)
        const keys = Object.keys(res.data.grouped)
        if (keys.length > 0) setActiveHoliday(keys[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const [filterYear, setFilterYear] = useState(null)

  const holidayNames = Object.keys(grouped).sort()

  // all unique years across all entries, sorted descending
  const allYears = [...new Set(Object.values(grouped).flat().map(e => e.year))].sort((a, b) => b - a)

  const createEntry = async (holidayName) => {
    setCreating(true)
    try {
      const res = await axios.post('/api/traditions', { holidayName, year: newYear })
      setGrouped(prev => ({
        ...prev,
        [holidayName]: [res.data.entry, ...(prev[holidayName] || [])],
      }))
      setActiveHoliday(holidayName)
      setShowPicker(false)
      setCustomHoliday('')
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setCreating(false)
    }
  }

  const updateEntry = (updated) => {
    setGrouped(prev => ({
      ...prev,
      [updated.holidayName]: prev[updated.holidayName].map(e => e.id === updated.id ? updated : e),
    }))
  }

  const deleteEntry = async (id) => {
    const entry = Object.values(grouped).flat().find(e => e.id === id)
    await axios.delete(`/api/traditions/${id}`)
    setGrouped(prev => {
      const updated = { ...prev }
      updated[entry.holidayName] = updated[entry.holidayName].filter(e => e.id !== id)
      if (updated[entry.holidayName].length === 0) {
        delete updated[entry.holidayName]
        setActiveHoliday(Object.keys(updated)[0] || null)
      }
      return updated
    })
  }

  const activeEntries = (activeHoliday ? (grouped[activeHoliday] || []) : [])
    .filter(e => filterYear === null || e.year === filterYear)

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your traditions...</p>
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
          <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>+ add entry</Button>
        </div>

        {/* heading */}
        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
          traditions
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">your holidays, year after year</p>

        {holidayNames.length === 0 && !showPicker ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">🕯️</p>
            <p className="text-sm text-[#a89bc2] mb-6">no traditions logged yet</p>
            <Button variant="primary" onClick={() => setShowPicker(true)}>log your first tradition</Button>
          </div>
        ) : (
          <>
            {/* year filter */}
            {allYears.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilterYear(null)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={filterYear === null ? {
                    background: 'color-mix(in srgb, var(--sp-text) 13%, transparent)', color: 'var(--sp-text)', border: '1px solid color-mix(in srgb, var(--sp-text) 27%, transparent)',
                  } : {
                    background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', border: '1px solid var(--sp-border-faint)',
                  }}
                >
                  all years
                </button>
                {allYears.map(y => (
                  <button
                    key={y}
                    onClick={() => setFilterYear(filterYear === y ? null : y)}
                    className="text-xs px-3 py-1 rounded-full transition-colors"
                    style={filterYear === y ? {
                      background: '#c4b5fd22', color: 'var(--sp-text-muted)', border: '1px solid #c4b5fd66',
                    } : {
                      background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', border: '1px solid var(--sp-border-faint)',
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* holiday tabs */}
            {holidayNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {holidayNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setActiveHoliday(name)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={activeHoliday === name ? {
                      background: '#c4b5fd22', color: 'var(--sp-text-muted)', border: '1px solid #c4b5fd66',
                    } : {
                      background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', border: '1px solid var(--sp-border-faint)',
                    }}
                  >
                    <span>{getEmoji(name)}</span>
                    <span>{name}</span>
                    <span className="text-[10px] text-[#c4b8d9]">({grouped[name].length})</span>
                  </button>
                ))}
              </div>
            )}

            {/* active holiday entries — timeline */}
            {activeHoliday && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                    {getEmoji(activeHoliday)} {activeHoliday}
                  </h2>
                  <p className="text-xs text-[#c4b8d9]">{activeEntries.length} {activeEntries.length === 1 ? 'memory' : 'memories'}</p>
                </div>

                <div className="space-y-3">
                  {activeEntries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onUpdate={updateEntry}
                      onDelete={deleteEntry}
                      onPhotoClick={setLightbox}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* add entry modal */}
        {showPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(45,42,53,0.4)' }}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                  log a tradition
                </h2>
                <button onClick={() => { setShowPicker(false); setCustomHoliday('') }} className="text-[#c4b8d9] hover:text-[#a89bc2] text-lg">✕</button>
              </div>

              {/* year */}
              <div className="mb-4">
                <p className="text-xs text-[#a89bc2] mb-1.5">year</p>
                <input
                  type="number"
                  value={newYear}
                  onChange={e => setNewYear(Number(e.target.value))}
                  min={1900}
                  max={2100}
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2]"
                />
              </div>

              {/* presets */}
              <p className="text-xs text-[#a89bc2] mb-2">choose a holiday</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_HOLIDAYS.map(h => (
                  <button
                    key={h.name}
                    onClick={() => createEntry(h.name)}
                    disabled={creating}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#faf8ff] border border-[#e4dff0] text-[#7c6f9b] hover:border-[#c4b5fd] transition-colors disabled:opacity-50"
                  >
                    {h.emoji} {h.name}
                  </button>
                ))}
              </div>

              {/* custom */}
              <p className="text-xs text-[#a89bc2] mb-2">or add your own</p>
              <div className="flex gap-2">
                <input
                  value={customHoliday}
                  onChange={e => setCustomHoliday(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && customHoliday.trim() && createEntry(customHoliday)}
                  placeholder="e.g. Obon, Songkran, Nowruz..."
                  className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                />
                <Button variant="secondary" onClick={() => customHoliday.trim() && createEntry(customHoliday)} disabled={creating || !customHoliday.trim()}>add</Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>

      {/* photo lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(20,18,26,0.85)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl leading-none transition-colors"
          >
            ✕
          </button>
          <img
            src={lightbox}
            alt="memory"
            className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
