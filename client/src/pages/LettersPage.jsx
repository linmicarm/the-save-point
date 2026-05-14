import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import DeleteButton from '../components/DeleteButton'

function isUnlocked(openOn) {
  if (!openOn) return true
  return new Date(openOn) <= new Date()
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso) {
  const diff = new Date(iso) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function LetterCard({ letter, onUpdate, onDelete }) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...letter })
  const [saving, setSaving]   = useState(false)
  const unlocked = isUnlocked(letter.openOn)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/letters/${letter.id}`, draft)
      onUpdate(res.data.letter)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl overflow-hidden">
      {/* envelope header */}
      <button
        onClick={() => unlocked && setOpen(o => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
        style={{ cursor: unlocked ? 'pointer' : 'default' }}
      >
        <span className="text-2xl mt-0.5 shrink-0">{unlocked ? '✉️' : '🔒'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#2d2a35] truncate">
            {letter.subject || `to ${letter.to}`}
          </p>
          <p className="text-[11px] text-[#a89bc2] mt-0.5">
            {letter.subject ? `to ${letter.to} · ` : ''}{formatDate(letter.createdAt)}
          </p>
          {!unlocked && letter.openOn && (
            <p className="text-[11px] text-[#c4b5fd] mt-1">
              opens in {daysUntil(letter.openOn)} day{daysUntil(letter.openOn) !== 1 ? 's' : ''} · {formatDate(letter.openOn)}
            </p>
          )}
        </div>
        {unlocked && (
          <span className="text-xs text-[#c4b8d9] mt-1">{open ? '▲' : '▼'}</span>
        )}
      </button>

      {/* letter body */}
      {open && unlocked && (
        <div className="px-5 pb-5 border-t border-[#f5f2fc]">
          {editing ? (
            <div className="pt-4 space-y-3">
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">to</p>
                <input value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">subject</p>
                <input value={draft.subject || ''} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                  placeholder="optional subject line"
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">letter</p>
                <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                  rows={8}
                  className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <DeleteButton onDelete={() => onDelete(letter.id)} className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setDraft({ ...letter }) }} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">cancel</button>
                  <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                    {saving ? 'saving...' : 'save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4">
              <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap font-serif" style={{ fontFamily: 'var(--font-serif)' }}>
                {letter.body}
              </p>
              <div className="flex justify-end mt-4">
                <button onClick={() => setEditing(true)} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors">edit</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LettersPage() {
  const { user } = useAuth()
  const [letters, setLetters]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft]         = useState({ to: 'future me', subject: '', body: '', openOn: '' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    axios.get('/api/letters').then(res => setLetters(res.data.letters)).finally(() => setLoading(false))
  }, [])

  const send = async () => {
    if (!draft.body.trim()) return
    setSaving(true)
    try {
      const res = await axios.post('/api/letters', {
        ...draft,
        openOn: draft.openOn || null,
      })
      setLetters(prev => [res.data.letter, ...prev])
      setComposing(false)
      setDraft({ to: 'future me', subject: '', body: '', openOn: '' })
    } finally {
      setSaving(false)
    }
  }

  const updateLetter = (updated) => setLetters(prev => prev.map(l => l.id === updated.id ? updated : l))
  const deleteLetter = async (id) => {
    await axios.delete(`/api/letters/${id}`)
    setLetters(prev => prev.filter(l => l.id !== id))
  }

  const locked = letters.filter(l => !isUnlocked(l.openOn))
  const unlocked = letters.filter(l => isUnlocked(l.openOn))

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your letters...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</Link>
          <button onClick={() => setComposing(true)} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">+ write a letter</button>
        </div>

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>letters</h1>
        <p className="text-sm text-[#a89bc2] mb-8">to your future self, or anyone worth writing to</p>

        {letters.length === 0 && !composing && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✉️</p>
            <p className="text-sm text-[#a89bc2] mb-6">no letters yet</p>
            <button onClick={() => setComposing(true)} className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors">
              write your first letter
            </button>
          </div>
        )}

        {/* compose */}
        {composing && (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>new letter</p>
              <button onClick={() => setComposing(false)} className="text-[#c4b8d9] hover:text-[#a89bc2] transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">to</p>
                <input value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                  placeholder="future me, a friend, anyone..."
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">subject <span className="text-[#d4cfe3] normal-case">(optional)</span></p>
                <input value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                  placeholder="a line that captures it"
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">letter</p>
                <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
                  placeholder="dear future me..."
                  rows={8} autoFocus
                  className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
              </div>
              <div>
                <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">seal until <span className="text-[#d4cfe3] normal-case">(optional)</span></p>
                <input type="date" value={draft.openOn} onChange={e => setDraft(d => ({ ...d, openOn: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
                <p className="text-[10px] text-[#c4b8d9] mt-1">leave blank to read anytime</p>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={send} disabled={saving || !draft.body.trim()}
                  className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
                  {saving ? 'sealing...' : 'seal & send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-3">sealed</p>
            <div className="space-y-3">
              {locked.map(l => <LetterCard key={l.id} letter={l} onUpdate={updateLetter} onDelete={deleteLetter} />)}
            </div>
          </div>
        )}

        {unlocked.length > 0 && (
          <div>
            <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-3">open</p>
            <div className="space-y-3">
              {unlocked.map(l => <LetterCard key={l.id} letter={l} onUpdate={updateLetter} onDelete={deleteLetter} />)}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
