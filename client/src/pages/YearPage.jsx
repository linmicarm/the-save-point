import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeleteButton from '../components/DeleteButton'

const PRESET_TAGS = [
  'personal', 'fitness', 'financial', 'spiritual',
  'career', 'relationships', 'health', 'creative',
  'learning', 'travel', 'home', 'mindset',
]

const TAG_COLORS = {
  personal:      { bg: '#fbeaf0', text: '#72243e' },
  fitness:       { bg: '#e1f5ee', text: '#0f6e56' },
  financial:     { bg: '#faeeda', text: '#854f0b' },
  spiritual:     { bg: '#eeedfe', text: '#3c3489' },
  career:        { bg: '#e6f1fb', text: '#185fa5' },
  relationships: { bg: '#fbeaf0', text: '#72243e' },
  health:        { bg: '#e1f5ee', text: '#0f6e56' },
  creative:      { bg: '#faece7', text: '#993c1d' },
  learning:      { bg: '#eaf3de', text: '#3b6d11' },
  travel:        { bg: '#e6f1fb', text: '#185fa5' },
  home:          { bg: '#faeeda', text: '#854f0b' },
  mindset:       { bg: '#eeedfe', text: '#3c3489' },
}

const tagStyle = (tag) => TAG_COLORS[tag] || { bg: '#f1efe8', text: '#5f5e5a' }

function ResolutionItem({ resolution, onUpdate, onDelete }) {
  const [expanded, setExpanded]   = useState(false)
  const [editing, setEditing]     = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [draft, setDraft]         = useState({
    title: resolution.title,
    why:   resolution.why   || '',
    notes: resolution.notes || '',
    tags:  resolution.tags  || [],
  })
  const [saving, setSaving] = useState(false)

  const toggleDraftTag = (tag) => {
    setDraft(d => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter(t => t !== tag) : [...d.tags, tag],
    }))
  }

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase()
    if (!t || draft.tags.includes(t)) return
    setDraft(d => ({ ...d, tags: [...d.tags, t] }))
    setCustomTag('')
  }

  const toggle = async () => {
    const res = await axios.patch(`/api/year/resolutions/${resolution.id}`, {
      completed: !resolution.completed,
    })
    onUpdate(res.data.resolution)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/year/resolutions/${resolution.id}`, draft)
      onUpdate(res.data.resolution)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft({ title: resolution.title, why: resolution.why || '', notes: resolution.notes || '', tags: resolution.tags || [] })
    setCustomTag('')
  }

  return (
    <div className={`border border-[#ede9f5] rounded-xl overflow-hidden transition-opacity ${resolution.completed ? 'opacity-60' : ''}`}>
      {/* checklist row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <button
          onClick={toggle}
          className="w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
          style={{
            borderColor: resolution.completed ? '#c4b5fd' : '#d4cfe3',
            background:  resolution.completed ? '#c4b5fd'  : 'transparent',
          }}
        >
          {resolution.completed && <span className="text-white text-[10px]">✓</span>}
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !editing && setExpanded(e => !e)}
        >
          <p className={`text-sm text-[#2d2a35] select-none ${resolution.completed ? 'line-through text-[#c4b8d9]' : ''}`}>
            {resolution.title}
          </p>
          {resolution.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {resolution.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tagStyle(tag).bg, color: tagStyle(tag).text }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setExpanded(true); setEditing(true) }}
            className="text-[10px] text-[#d4cfe3] hover:text-[#a89bc2] transition-colors"
          >
            edit
          </button>
          <DeleteButton onDelete={() => onDelete(resolution.id)} label="✕" className="text-[10px] text-[#e4dff0] hover:text-rose-300 transition-colors" />
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* expanded depth */}
      {expanded && (
        <div className="px-4 py-3 bg-[#faf8ff] border-t border-[#f0ecfa] space-y-3">
          {editing ? (
            <>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">resolution</p>
                <input
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#a89bc2]"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">why this matters</p>
                <textarea
                  value={draft.why}
                  onChange={e => setDraft(d => ({ ...d, why: e.target.value }))}
                  placeholder="what's the deeper reason?"
                  rows={2}
                  className="w-full text-sm text-[#5a5065] bg-white border border-[#e4dff0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9]"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">progress notes</p>
                <textarea
                  value={draft.notes}
                  onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                  placeholder="how's it going? what's changed?"
                  rows={3}
                  className="w-full text-sm text-[#5a5065] bg-white border border-[#e4dff0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9]"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleDraftTag(tag)}
                      className="text-[10px] px-2 py-1 rounded-full font-medium transition-opacity"
                      style={draft.tags.includes(tag)
                        ? { background: tagStyle(tag).bg, color: tagStyle(tag).text, outline: `1.5px solid ${tagStyle(tag).text}44` }
                        : { background: '#f5f3fa', color: '#b0a3c8' }
                      }
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                    placeholder="custom tag..."
                    className="flex-1 text-xs text-[#2d2a35] bg-white border border-[#e4dff0] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                  />
                  {customTag.trim() && (
                    <button onClick={addCustomTag} className="text-xs text-[#a89bc2] hover:text-[#7c6f9b]">add</button>
                  )}
                </div>
                {draft.tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {draft.tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                        style={{ background: tagStyle(tag).bg, color: tagStyle(tag).text }}
                      >
                        {tag}
                        <button onClick={() => toggleDraftTag(tag)} className="hover:opacity-70">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors disabled:opacity-50"
                >
                  {saving ? 'saving...' : 'save'}
                </button>
                <button onClick={cancelEdit} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
                  cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {resolution.why && (
                <div>
                  <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">why this matters</p>
                  <p className="text-sm text-[#5a5065] leading-relaxed">{resolution.why}</p>
                </div>
              )}
              {resolution.notes && (
                <div>
                  <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1">progress notes</p>
                  <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">{resolution.notes}</p>
                </div>
              )}
              {!resolution.why && !resolution.notes && (
                <p className="text-xs text-[#c4b8d9] italic">no notes yet — click edit to add your why and track progress</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function YearPage() {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const isJan1 = new Date().getMonth() === 0 && new Date().getDate() === 1

  const [entries, setEntries]       = useState([])
  const [activeYear, setActiveYear] = useState(currentYear)
  const [loading, setLoading]       = useState(true)
  const [newTitle, setNewTitle]     = useState('')
  const [adding, setAdding]         = useState(false)
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerDraft, setHeaderDraft] = useState({ theme: '', quote: '' })
  const [showNewYear, setShowNewYear] = useState(false)
  const [newYearVal, setNewYearVal]   = useState(currentYear)
  const [creatingYear, setCreatingYear] = useState(false)

  useEffect(() => {
    axios.get('/api/year')
      .then(res => {
        setEntries(res.data.entries)
        if (res.data.entries.length > 0) {
          setActiveYear(res.data.entries[0].year)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const entry = entries.find(e => e.year === activeYear)

  const createYear = async () => {
    setCreatingYear(true)
    try {
      const res = await axios.post('/api/year', { year: newYearVal })
      setEntries(prev => [res.data.entry, ...prev].sort((a, b) => b.year - a.year))
      setActiveYear(res.data.entry.year)
      setShowNewYear(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setCreatingYear(false)
    }
  }

  const saveHeader = async () => {
    const res = await axios.patch(`/api/year/${activeYear}`, headerDraft)
    setEntries(prev => prev.map(e => e.year === activeYear ? res.data.entry : e))
    setEditingHeader(false)
  }

  const startEditHeader = () => {
    setHeaderDraft({ theme: entry.theme || '', quote: entry.quote || '' })
    setEditingHeader(true)
  }

  const addResolution = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await axios.post(`/api/year/${activeYear}/resolutions`, { title: newTitle })
      setEntries(prev => prev.map(e =>
        e.year === activeYear
          ? { ...e, resolutions: [...e.resolutions, res.data.resolution] }
          : e
      ))
      setNewTitle('')
    } finally {
      setAdding(false)
    }
  }

  const updateResolution = (updated) => {
    setEntries(prev => prev.map(e =>
      e.year === activeYear
        ? { ...e, resolutions: e.resolutions.map(r => r.id === updated.id ? updated : r) }
        : e
    ))
  }

  const deleteResolution = async (id) => {
    await axios.delete(`/api/year/resolutions/${id}`)
    setEntries(prev => prev.map(e =>
      e.year === activeYear
        ? { ...e, resolutions: e.resolutions.filter(r => r.id !== id) }
        : e
    ))
  }

  const [filterTag, setFilterTag] = useState(null)

  const completed = entry?.resolutions.filter(r => r.completed).length || 0
  const total     = entry?.resolutions.length || 0

  const allTags = [...new Set(entry?.resolutions.flatMap(r => r.tags || []) || [])]
  const visibleResolutions = filterTag
    ? entry?.resolutions.filter(r => r.tags?.includes(filterTag))
    : entry?.resolutions

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your year...</p>
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
          <button
            onClick={() => setShowNewYear(true)}
            className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors"
          >
            + new year
          </button>
        </div>

        {/* jan 1 prompt */}
        {isJan1 && !entries.find(e => e.year === currentYear) && (
          <div className="bg-[#c4b5fd18] border border-[#c4b5fd44] rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
            <p className="text-sm text-[#7c6f9b]">✦ happy new year — ready to set your intentions?</p>
            <button
              onClick={() => { setNewYearVal(currentYear); createYear() }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors ml-3 shrink-0"
            >
              begin {currentYear}
            </button>
          </div>
        )}

        {entries.length === 0 && !showNewYear ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✦</p>
            <h1 className="text-xl font-medium text-[#2d2a35] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              no years yet
            </h1>
            <p className="text-sm text-[#a89bc2] mb-6">start with this year or any year that matters to you</p>
            <button
              onClick={() => setShowNewYear(true)}
              className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors"
            >
              begin a year
            </button>
          </div>
        ) : (
          <>
            {/* year tabs */}
            {entries.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {entries.map(e => (
                  <button
                    key={e.year}
                    onClick={() => setActiveYear(e.year)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={activeYear === e.year ? {
                      background: '#c4b5fd22', color: '#7c6f9b', border: '1px solid #c4b5fd66',
                    } : {
                      background: 'white', color: '#a89bc2', border: '1px solid #ede9f5',
                    }}
                  >
                    {e.year}
                  </button>
                ))}
              </div>
            )}

            {entry && (
              <>
                {/* year header */}
                <div className="mb-8">
                  {editingHeader ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-[#a89bc2] mb-1.5">theme for {activeYear}</p>
                        <input
                          value={headerDraft.theme}
                          onChange={e => setHeaderDraft(d => ({ ...d, theme: e.target.value }))}
                          placeholder="e.g. the year of becoming"
                          className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-[#a89bc2] mb-1.5">a guiding quote</p>
                        <input
                          value={headerDraft.quote}
                          onChange={e => setHeaderDraft(d => ({ ...d, quote: e.target.value }))}
                          placeholder="something that holds this year"
                          className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveHeader} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors">
                          save
                        </button>
                        <button onClick={() => setEditingHeader(false)} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      <div className="flex items-start justify-between">
                        <h1 className="text-3xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                          {activeYear}
                        </h1>
                        <button
                          onClick={startEditHeader}
                          className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors mt-1"
                        >
                          edit
                        </button>
                      </div>
                      {entry.theme && (
                        <p className="text-base text-[#7c6f9b] mt-1" style={{ fontFamily: 'var(--font-serif)' }}>
                          {entry.theme}
                        </p>
                      )}
                      {entry.quote && (
                        <p className="text-sm text-[#a89bc2] italic mt-2 border-l-2 border-[#e4dff0] pl-3">
                          "{entry.quote}"
                        </p>
                      )}
                      {!entry.theme && !entry.quote && (
                        <p className="text-sm text-[#c4b8d9] italic mt-1 cursor-pointer hover:text-[#a89bc2]" onClick={startEditHeader}>
                          add a theme and guiding quote...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* progress */}
                {total > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-[#a89bc2]">{completed} of {total} complete</p>
                      <p className="text-xs text-[#c4b8d9]">{Math.round((completed / total) * 100)}%</p>
                    </div>
                    <div className="h-1.5 bg-[#f0ecfa] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#c4b5fd] transition-all"
                        style={{ width: `${(completed / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* tag filter */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <button
                      onClick={() => setFilterTag(null)}
                      className="text-[10px] px-2.5 py-1 rounded-full transition-colors"
                      style={!filterTag
                        ? { background: '#c4b5fd22', color: '#7c6f9b', border: '1px solid #c4b5fd66' }
                        : { background: '#f5f3fa', color: '#b0a3c8', border: '1px solid transparent' }
                      }
                    >
                      all
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                        className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-opacity"
                        style={filterTag === tag
                          ? { background: tagStyle(tag).bg, color: tagStyle(tag).text, outline: `1.5px solid ${tagStyle(tag).text}44` }
                          : { background: '#f5f3fa', color: '#b0a3c8' }
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* resolutions */}
                <div className="space-y-2 mb-6">
                  {visibleResolutions.map(r => (
                    <ResolutionItem
                      key={r.id}
                      resolution={r}
                      onUpdate={updateResolution}
                      onDelete={deleteResolution}
                    />
                  ))}
                </div>

                {/* add resolution */}
                <div className="flex gap-2">
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addResolution()}
                    placeholder="add a resolution..."
                    className="flex-1 text-sm text-[#2d2a35] bg-white border border-[#ede9f5] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                  />
                  <button
                    onClick={addResolution}
                    disabled={adding || !newTitle.trim()}
                    className="text-xs px-4 py-2.5 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    add
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* new year modal */}
        {showNewYear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(45,42,53,0.4)' }}>
            <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl">
              <h2 className="text-base font-medium text-[#2d2a35] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                begin a year
              </h2>
              <input
                type="number"
                value={newYearVal}
                onChange={e => setNewYearVal(Number(e.target.value))}
                min={2000}
                max={2100}
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={createYear}
                  disabled={creatingYear}
                  className="flex-1 py-2.5 rounded-xl bg-[#c4b5fd] text-white text-xs font-medium hover:bg-[#b39ef7] transition-colors disabled:opacity-50"
                >
                  {creatingYear ? 'creating...' : 'begin'}
                </button>
                <button
                  onClick={() => setShowNewYear(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4dff0] text-xs text-[#a89bc2] hover:text-[#7c6f9b] transition-colors"
                >
                  cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
