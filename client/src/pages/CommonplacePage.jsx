import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeleteButton from '../components/DeleteButton'
import Button from '../components/Button'

const TAG_COLORS = ['#c4b5fd', '#fda4af', '#86efac', '#fdba74', '#93c5fd', '#d4b896']
const tagColor = (tag, all) => TAG_COLORS[all.indexOf(tag) % TAG_COLORS.length]

function EntryCard({ entry, allTags, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...entry, tagInput: '' })
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/commonplace/${entry.id}`, {
        body: draft.body, source: draft.source, tags: draft.tags, note: draft.note,
      })
      onUpdate(res.data.entry)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase()
    if (t && !draft.tags.includes(t)) setDraft(d => ({ ...d, tags: [...d.tags, t], tagInput: '' }))
    else setDraft(d => ({ ...d, tagInput: '' }))
  }

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl p-5">
      {editing ? (
        <div className="space-y-3">
          <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
            rows={4} placeholder="the quote or passage..."
            className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed placeholder-[#c4b8d9]" />
          <input value={draft.source || ''} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))}
            placeholder="source / author"
            className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
          <textarea value={draft.note || ''} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
            rows={2} placeholder="your note or reflection..."
            className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed placeholder-[#c4b8d9]" />
          {/* tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {draft.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                  style={{ background: tagColor(t, allTags) }}>
                  {t}
                  <button onClick={() => setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }))} className="opacity-70 hover:opacity-100">✕</button>
                </span>
              ))}
            </div>
            <input value={draft.tagInput} onChange={e => setDraft(d => ({ ...d, tagInput: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(draft.tagInput) } }}
              placeholder="add a tag, press Enter"
              className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <DeleteButton onDelete={() => onDelete(entry.id)} className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
            <div className="flex gap-2">
              <Button variant="quiet" onClick={() => { setEditing(false); setDraft({ ...entry, tagInput: '' }) }}>cancel</Button>
              <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                {saving ? 'saving...' : 'save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#2d2a35] leading-relaxed whitespace-pre-wrap mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
            "{entry.body}"
          </p>
          {entry.source && <p className="text-xs text-[#a89bc2] mb-3">— {entry.source}</p>}
          {entry.note && <p className="text-xs text-[#7c6f9b] italic leading-relaxed mb-3">{entry.note}</p>}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {entry.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ background: tagColor(t, allTags) }}>{t}</span>
              ))}
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>edit</Button>
        </>
      )}
    </div>
  )
}

export default function CommonplacePage() {
  const { user } = useAuth()
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [filterTag, setFilterTag] = useState(null)
  const [draft, setDraft]       = useState({ body: '', source: '', note: '', tags: [], tagInput: '' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    axios.get('/api/commonplace').then(res => setEntries(res.data.entries)).finally(() => setLoading(false))
  }, [])

  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  const addEntry = async () => {
    if (!draft.body.trim()) return
    setSaving(true)
    try {
      const res = await axios.post('/api/commonplace', { body: draft.body, source: draft.source, note: draft.note, tags: draft.tags })
      setEntries(prev => [res.data.entry, ...prev])
      setAdding(false)
      setDraft({ body: '', source: '', note: '', tags: [], tagInput: '' })
    } finally {
      setSaving(false)
    }
  }

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase()
    if (t && !draft.tags.includes(t)) setDraft(d => ({ ...d, tags: [...d.tags, t], tagInput: '' }))
    else setDraft(d => ({ ...d, tagInput: '' }))
  }

  const updateEntry = (updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  const deleteEntry = async (id) => {
    await axios.delete(`/api/commonplace/${id}`)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const visible = filterTag ? entries.filter(e => e.tags.includes(filterTag)) : entries

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your commonplace...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</Link>
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>+ add entry</Button>
        </div>

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>commonplace</h1>
        <p className="text-sm text-[#a89bc2] mb-8">quotes, passages, and things worth keeping</p>

        {/* tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setFilterTag(null)}
              className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
              style={!filterTag ? { background: 'color-mix(in srgb, var(--sp-text) 13%, transparent)', color: 'var(--sp-text)', borderColor: 'color-mix(in srgb, var(--sp-text) 27%, transparent)' } : { background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border-faint)' }}>
              all
            </button>
            {allTags.map(t => (
              <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)}
                className="text-[10px] px-2.5 py-1 rounded-full border transition-colors text-white"
                style={{ background: filterTag === t ? tagColor(t, allTags) : `${tagColor(t, allTags)}33`, borderColor: `${tagColor(t, allTags)}66`, color: filterTag === t ? 'white' : tagColor(t, allTags) }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* add form */}
        {adding && (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-6">
            <div className="flex justify-between mb-4">
              <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>new entry</p>
              <button onClick={() => setAdding(false)} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
            </div>
            <div className="space-y-3">
              <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                rows={4} placeholder="the quote or passage..." autoFocus
                className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed placeholder-[#c4b8d9]" />
              <input value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))}
                placeholder="source / author"
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              <textarea value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
                rows={2} placeholder="your reflection..."
                className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed placeholder-[#c4b8d9]" />
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {draft.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                      style={{ background: tagColor(t, allTags) }}>
                      {t}<button onClick={() => setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }))} className="opacity-70 hover:opacity-100">✕</button>
                    </span>
                  ))}
                </div>
                <input value={draft.tagInput} onChange={e => setDraft(d => ({ ...d, tagInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(draft.tagInput) } }}
                  placeholder="add a tag, press Enter"
                  className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              </div>
              <div className="flex justify-end">
                <button onClick={addEntry} disabled={saving || !draft.body.trim()}
                  className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'saving...' : 'add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {visible.length === 0 && !adding && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">📖</p>
            <p className="text-sm text-[#a89bc2] mb-6">nothing collected yet</p>
            <Button variant="primary" onClick={() => setAdding(true)}>add your first entry</Button>
          </div>
        )}

        <div className="space-y-4 stagger-children">
          {visible.map(e => <EntryCard key={e.id} entry={e} allTags={allTags} onUpdate={updateEntry} onDelete={deleteEntry} />)}
        </div>

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
