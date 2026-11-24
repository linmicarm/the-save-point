import { useEffect, useState } from 'react'

import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

const CATEGORIES = ['personal', 'career', 'travel', 'relationships', 'health', 'creative', 'learning', 'home', 'financial', 'spiritual']

const CAT_COLORS = {
  personal: '#c4b5fd', career: '#93c5fd', travel: '#86efac', relationships: '#fda4af',
  health: '#86efac', creative: '#fdba74', learning: '#93c5fd', home: '#d4b896',
  financial: '#86efac', spiritual: '#c4b5fd',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function MilestoneItem({ m, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...m, date: m.date.split('T')[0] })
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/milestones/${m.id}`, draft)
      onUpdate(res.data.milestone)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-4">
      {/* timeline dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white shadow-sm bg-white z-10">
          {m.emoji || '✦'}
        </div>
        <div className="w-px flex-1 bg-[#e4dff0] mt-1" />
      </div>

      {/* content */}
      <div className="flex-1 pb-8">
        {editing ? (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="✦" />
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                className="flex-1 text-sm font-medium text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
            </div>
            <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
              className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
            <textarea value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              rows={2} placeholder="a note about this moment..."
              className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setDraft(d => ({ ...d, category: d.category === c ? null : c }))}
                  className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                  style={draft.category === c ? { background: CAT_COLORS[c] + '33', color: CAT_COLORS[c], borderColor: CAT_COLORS[c] + '66' } : { background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border-faint)' }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <DeleteButton onDelete={() => onDelete(m.id)} className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDraft(d => ({ ...d, isPublic: !d.isPublic }))}
                  className="text-[10px] px-2 py-0.5 rounded-md border transition-colors"
                  style={draft.isPublic ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' } : { background: 'transparent', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
                >
                  {draft.isPublic ? '✦ public' : 'private'}
                </button>
                <Button variant="quiet" onClick={() => { setEditing(false); setDraft({ ...m, date: m.date.split('T')[0] }) }}>cancel</Button>
                <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'saving...' : 'save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#ede9f5] rounded-2xl px-4 py-3 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#2d2a35]">{m.title}</p>
                <p className="text-[11px] text-[#c4b8d9] mt-0.5">{formatDate(m.date)}</p>
                {m.category && (
                  <span className="inline-block text-[9px] px-2 py-0.5 rounded-full mt-1.5"
                    style={{ background: (CAT_COLORS[m.category] || '#c4b5fd') + '22', color: CAT_COLORS[m.category] || '#c4b5fd' }}>
                    {m.category}
                  </span>
                )}
                {m.description && <p className="text-xs text-[#7c6f9b] mt-2 leading-relaxed">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-2 mt-1 shrink-0">
                {m.isPublic && <span className="text-[9px] text-[#c4b5fd]">✦</span>}
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>edit</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MilestonesPage() {
  const { user } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [filterCat, setFilterCat]   = useState(null)
  const [draft, setDraft]           = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '', emoji: '', category: '' })
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    axios.get('/api/milestones').then(res => setMilestones(res.data.milestones)).finally(() => setLoading(false))
  }, [])

  const addMilestone = async () => {
    if (!draft.title.trim() || !draft.date) return
    setSaving(true)
    try {
      const res = await axios.post('/api/milestones', draft)
      setMilestones(prev => [res.data.milestone, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
      setAdding(false)
      setDraft({ title: '', date: new Date().toISOString().split('T')[0], description: '', emoji: '', category: '' })
    } finally {
      setSaving(false)
    }
  }

  const updateMilestone = (updated) => {
    setMilestones(prev => prev.map(m => m.id === updated.id ? updated : m).sort((a, b) => new Date(b.date) - new Date(a.date)))
  }
  const deleteMilestone = async (id) => {
    await axios.delete(`/api/milestones/${id}`)
    setMilestones(prev => prev.filter(m => m.id !== id))
  }

  const usedCats = [...new Set(milestones.map(m => m.category).filter(Boolean))]
  const visible = filterCat ? milestones.filter(m => m.category === filterCat) : milestones

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your milestones...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <BackLink to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</BackLink>
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>+ add milestone</Button>
        </div>

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>milestones</h1>
        <p className="text-sm text-[#a89bc2] mb-8">the moments that marked you</p>

        {usedCats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setFilterCat(null)}
              className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
              style={!filterCat ? { background: 'color-mix(in srgb, var(--sp-text) 13%, transparent)', color: 'var(--sp-text)', borderColor: 'color-mix(in srgb, var(--sp-text) 27%, transparent)' } : { background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border-faint)' }}>
              all
            </button>
            {usedCats.map(c => (
              <button key={c} onClick={() => setFilterCat(filterCat === c ? null : c)}
                className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                style={filterCat === c ? { background: (CAT_COLORS[c] || '#c4b5fd') + '33', color: CAT_COLORS[c] || '#c4b5fd', borderColor: (CAT_COLORS[c] || '#c4b5fd') + '66' } : { background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border-faint)' }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {adding && (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-8">
            <div className="flex justify-between mb-4">
              <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>new milestone</p>
              <button onClick={() => setAdding(false)} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="✦" />
                <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="what happened?" autoFocus
                  className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              </div>
              <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
              <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                rows={2} placeholder="a note about this moment..."
                className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setDraft(d => ({ ...d, category: d.category === c ? '' : c }))}
                    className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                    style={draft.category === c ? { background: CAT_COLORS[c] + '33', color: CAT_COLORS[c], borderColor: CAT_COLORS[c] + '66' } : { background: 'var(--sp-surface)', color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border-faint)' }}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={addMilestone} disabled={saving || !draft.title.trim()}
                  className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'saving...' : 'add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {visible.length === 0 && !adding ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✦</p>
            <p className="text-sm text-[#a89bc2] mb-6">no milestones yet</p>
            <Button variant="primary" onClick={() => setAdding(true)}>add your first milestone</Button>
          </div>
        ) : (
          <div className="stagger-children">
            {visible.map(m => (
              <MilestoneItem key={m.id} m={m} onUpdate={updateMilestone} onDelete={deleteMilestone} />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-4">✦ the save point</p>
      </div>
    </div>
  )
}
