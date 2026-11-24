import { useEffect, useState } from 'react'

import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeleteButton from '../components/DeleteButton'
import Button from '../components/Button'
import BackLink from '../components/BackLink'
import PageTabs from '../components/PageTabs'

function isOpen(openOn) {
  return new Date(openOn) <= new Date()
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso) {
  return Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24))
}

function CapsuleCard({ entry, onUpdate, onDelete }) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...entry, openOn: entry.openOn.split('T')[0] })
  const [saving, setSaving]   = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const unlocked = isOpen(entry.openOn)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/capsule/${entry.id}`, draft)
      onUpdate(res.data.entry)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-white border border-[#ede9f5] rounded-2xl overflow-hidden">
        {/* sealed capsule visual */}
        {!unlocked && (
          <div className="h-2 w-full" style={{ background: 'repeating-linear-gradient(45deg, #c4b5fd22, #c4b5fd22 4px, transparent 4px, transparent 10px)' }} />
        )}
        {unlocked && entry.photoUrl && !open && (
          <button onClick={() => setLightbox(entry.photoUrl)} className="w-full block focus:outline-none">
            <img src={entry.photoUrl} alt={entry.title} className="w-full object-contain hover:opacity-95 transition-opacity"
              onError={e => e.target.closest('button').style.display = 'none'} />
          </button>
        )}

        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5 shrink-0">{unlocked ? '📬' : '📦'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2d2a35]">{entry.title}</p>
              {unlocked ? (
                <p className="text-[11px] text-[#a89bc2] mt-0.5">opened {formatDate(entry.openOn)}</p>
              ) : (
                <p className="text-[11px] text-[#c4b5fd] mt-0.5">
                  opens in {daysUntil(entry.openOn)} day{daysUntil(entry.openOn) !== 1 ? 's' : ''} · {formatDate(entry.openOn)}
                </p>
              )}
            </div>
            {unlocked && (
              <button onClick={() => { setOpen(o => !o); setEditing(false) }} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors mt-1">
                {open ? '▲' : '▼'}
              </button>
            )}
          </div>

          {open && unlocked && (
            <div className="mt-4 pt-4 border-t border-[#f5f2fc]">
              {editing ? (
                <div className="space-y-3">
                  <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                    className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
                  <textarea value={draft.body || ''} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                    rows={6} placeholder="what did you seal inside?"
                    className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
                  <input value={draft.photoUrl || ''} onChange={e => setDraft(d => ({ ...d, photoUrl: e.target.value }))}
                    placeholder="photo URL (optional)"
                    className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
                  <input type="date" value={draft.openOn} onChange={e => setDraft(d => ({ ...d, openOn: e.target.value }))}
                    className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
                  <div className="flex items-center justify-between">
                    <DeleteButton onDelete={() => onDelete(entry.id)} className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
                    <div className="flex gap-2">
                      <Button variant="quiet" onClick={() => { setEditing(false); setDraft({ ...entry, openOn: entry.openOn.split('T')[0] }) }}>cancel</Button>
                      <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                        {saving ? 'saving...' : 'save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {entry.body && <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap mb-4">{entry.body}</p>}
                  {entry.photoUrl && (
                    <button onClick={() => setLightbox(entry.photoUrl)} className="w-full block mb-4 rounded-xl overflow-hidden focus:outline-none">
                      <img src={entry.photoUrl} alt={entry.title} className="w-full object-contain hover:opacity-95 transition-opacity"
                        onError={e => e.target.closest('button').style.display = 'none'} />
                    </button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>edit</Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" style={{ background: 'rgba(20,18,26,0.85)' }} onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl leading-none">✕</button>
          <img src={lightbox} alt={entry.title} className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

export default function CapsulePage() {
  const { user } = useAuth()
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft]       = useState({ title: '', body: '', photoUrl: '', openOn: '' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    axios.get('/api/capsule').then(res => setEntries(res.data.entries)).finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!draft.title.trim() || !draft.openOn) return
    setSaving(true)
    try {
      const res = await axios.post('/api/capsule', draft)
      setEntries(prev => [...prev, res.data.entry].sort((a, b) => new Date(a.openOn) - new Date(b.openOn)))
      setCreating(false)
      setDraft({ title: '', body: '', photoUrl: '', openOn: '' })
    } finally {
      setSaving(false)
    }
  }

  const updateEntry = (updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  const deleteEntry = async (id) => {
    await axios.delete(`/api/capsule/${id}`)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const sealed = entries.filter(e => !isOpen(e.openOn))
  const opened = entries.filter(e => isOpen(e.openOn))

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your capsules...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">
        <PageTabs group="letters" />
        <div className="flex items-center justify-between mb-8">
          <BackLink to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</BackLink>
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>+ new capsule</Button>
        </div>

        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>capsule</h1>
        <p className="text-sm text-[#a89bc2] mb-8">seal a moment away and let time open it</p>

        {creating && (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-6">
            <div className="flex justify-between mb-4">
              <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>new capsule</p>
              <button onClick={() => setCreating(false)} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
            </div>
            <div className="space-y-3">
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="give this capsule a name..." autoFocus
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                rows={6} placeholder="what do you want your future self to find here?"
                className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
              <input value={draft.photoUrl} onChange={e => setDraft(d => ({ ...d, photoUrl: e.target.value }))}
                placeholder="photo URL (optional)"
                className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">open on</p>
                <input type="date" value={draft.openOn} onChange={e => setDraft(d => ({ ...d, openOn: e.target.value }))}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
              </div>
              <div className="flex justify-end">
                <button onClick={create} disabled={saving || !draft.title.trim() || !draft.openOn}
                  className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'sealing...' : 'seal it'}
                </button>
              </div>
            </div>
          </div>
        )}

        {entries.length === 0 && !creating && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">📦</p>
            <p className="text-sm text-[#a89bc2] mb-6">no capsules yet</p>
            <Button variant="primary" onClick={() => setCreating(true)}>seal your first capsule</Button>
          </div>
        )}

        {sealed.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-3">sealed</p>
            <div className="space-y-3">
              {sealed.map(e => <CapsuleCard key={e.id} entry={e} onUpdate={updateEntry} onDelete={deleteEntry} />)}
            </div>
          </div>
        )}

        {opened.length > 0 && (
          <div>
            <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-3">opened</p>
            <div className="space-y-3">
              {opened.map(e => <CapsuleCard key={e.id} entry={e} onUpdate={updateEntry} onDelete={deleteEntry} />)}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
