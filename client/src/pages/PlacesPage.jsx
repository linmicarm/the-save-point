import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'

const TYPES = [
  { key: 'lived',   label: "places I've lived",    emoji: '🏠' },
  { key: 'visited', label: "places I've visited",  emoji: '✈️' },
  { key: 'want',    label: 'places I want to go',  emoji: '🌍' },
]

function PlaceCard({ place, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...place })
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/places/${place.id}`, draft)
      onUpdate(res.data.place)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="📍" />
        <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          className="flex-1 text-sm font-medium text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]" />
      </div>
      <input type="number" value={draft.year || ''} onChange={e => setDraft(d => ({ ...d, year: e.target.value }))}
        placeholder="year (optional)"
        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
      <textarea value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
        rows={2} placeholder="what this place means to you..."
        className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
      <div className="flex items-center justify-between">
        <DeleteButton onDelete={() => onDelete(place.id)} className="text-xs text-[#e4dff0] hover:text-rose-300 transition-colors" />
        <div className="flex gap-2">
          <button onClick={() => { setEditing(false); setDraft({ ...place }) }} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">cancel</button>
          <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
            {saving ? 'saving...' : 'save'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl px-4 py-3 flex items-start gap-3 group">
      <span className="text-xl mt-0.5 shrink-0">{place.emoji || '📍'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2d2a35]">{place.name}</p>
        {place.year && <p className="text-[11px] text-[#c4b8d9]">{place.year}</p>}
        {place.description && <p className="text-xs text-[#7c6f9b] mt-1 leading-relaxed">{place.description}</p>}
      </div>
      <button onClick={() => setEditing(true)} className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1">
        edit
      </button>
    </div>
  )
}

export default function PlacesPage() {
  const { user } = useAuth()
  const [places, setPlaces]   = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(null) // 'lived'|'visited'|'want'
  const [draft, setDraft]     = useState({ name: '', type: '', description: '', emoji: '', year: '' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    axios.get('/api/places').then(res => setPlaces(res.data.places)).finally(() => setLoading(false))
  }, [])

  const startAdding = (type) => {
    setAdding(type)
    setDraft({ name: '', type, description: '', emoji: '', year: '' })
  }

  const addPlace = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    try {
      const res = await axios.post('/api/places', draft)
      setPlaces(prev => [...prev, res.data.place])
      setAdding(null)
    } finally {
      setSaving(false)
    }
  }

  const updatePlace = (updated) => setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p))
  const deletePlace = async (id) => {
    await axios.delete(`/api/places/${id}`)
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your places...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</Link>
        </div>

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>places</h1>
        <p className="text-sm text-[#a89bc2] mb-8">the places that made you, and the ones still waiting</p>

        <div className="space-y-8">
          {TYPES.map(({ key, label, emoji }) => {
            const section = places.filter(p => p.type === key)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[#2d2a35]">{emoji} {label}</p>
                  <button onClick={() => startAdding(key)} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors">+ add</button>
                </div>

                {adding === key && (
                  <div className="bg-white border border-[#ede9f5] rounded-2xl p-4 mb-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="📍" />
                      <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        placeholder="place name" autoFocus
                        className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
                    </div>
                    {key !== 'want' && (
                      <input type="number" value={draft.year} onChange={e => setDraft(d => ({ ...d, year: e.target.value }))}
                        placeholder="year (optional)"
                        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]" />
                    )}
                    <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                      rows={2} placeholder="what this place means to you..."
                      className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setAdding(null)} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">cancel</button>
                      <button onClick={addPlace} disabled={saving || !draft.name.trim()}
                        className="text-xs px-3 py-1.5 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-40 transition-colors">
                        {saving ? 'saving...' : 'add'}
                      </button>
                    </div>
                  </div>
                )}

                {section.length === 0 && adding !== key && (
                  <p className="text-xs text-[#d4cfe3] italic px-1">none yet</p>
                )}

                <div className="space-y-2 stagger-children">
                  {section.map(p => <PlaceCard key={p.id} place={p} onUpdate={updatePlace} onDelete={deletePlace} />)}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
