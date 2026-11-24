import { useEffect, useState, useRef } from 'react'

import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EmojiPicker from '../components/EmojiPicker'
import DeleteButton from '../components/DeleteButton'
import SeasonBadge from '../components/SeasonBadge'
import { uploadImage } from '../utils/uploadImage'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

const TAG_COLORS = ['#c4b5fd', '#fda4af', '#86efac', '#fdba74', '#93c5fd', '#d4b896']
const tagColor = (tag, all) => TAG_COLORS[all.indexOf(tag) % TAG_COLORS.length]

const TYPES = [
  { key: 'lived',   label: "lived",       long: "places I've lived",   emoji: '🏠' },
  { key: 'visited', label: "visited",     long: "places I've visited", emoji: '✈️' },
  { key: 'want',    label: "want to go",  long: "want to go",          emoji: '🌍' },
]

// ── Star rating ──────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !readOnly && onChange(n === value ? null : n)}
          className={`text-base leading-none ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
          style={{ color: n <= (value || 0) ? '#f59e0b' : '#e4dff0' }}
        >★</button>
      ))}
    </span>
  )
}

// ── Photo strip + lightbox ────────────────────────────────────
function PhotoStrip({ photos, onRemove }) {
  const [lightbox, setLightbox] = useState(null)
  if (!photos?.length) return null
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-2 pb-0.5">
        {photos.map((url, i) => (
          <div key={i} className="relative shrink-0 group/photo">
            <img
              src={url}
              alt=""
              onClick={() => setLightbox(url)}
              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            />
            {onRemove && (
              <button
                onClick={e => { e.stopPropagation(); onRemove(i) }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7c6f9b] text-white text-[9px] leading-none items-center justify-center hidden group-hover/photo:flex shadow-sm"
              >×</button>
            )}
          </div>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >✕</button>
        </div>
      )}
    </>
  )
}

// ── Tag input ─────────────────────────────────────────────────
function TagInput({ tags, onChange, allTags }) {
  const [input, setInput] = useState('')
  const add = (raw) => {
    const t = raw.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  return (
    <div>
      <p className="text-xs text-[#a89bc2] mb-1.5">tags</p>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full text-white"
            style={{ background: tagColor(t, allTags) }}
          >
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-70 hover:opacity-100 leading-none">×</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
          if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
        }}
        placeholder="add a tag, press enter..."
        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
      />
    </div>
  )
}

// ── Photo upload button ───────────────────────────────────────
function PhotoUpload({ photos, onChange }) {
  const fileRef = useRef(null)
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    const resized = await Promise.all(files.map(f => uploadImage(f, 'places', 900)))
    onChange([...photos, ...resized])
    e.target.value = ''
  }
  return (
    <div>
      <p className="text-xs text-[#a89bc2] mb-1.5">photos</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {photos.map((url, i) => (
          <div key={i} className="relative group/p shrink-0">
            <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7c6f9b] text-white text-[9px] leading-none items-center justify-center hidden group-hover/p:flex"
            >×</button>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}>+ add photos</Button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  )
}

// ── Place card ────────────────────────────────────────────────
function PlaceCard({ place, allTags, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...place, photos: place.photos || [], tags: place.tags || [] })
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
      {/* name + emoji + type */}
      <div className="flex items-center gap-2">
        <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="📍" />
        <input
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          className="flex-1 text-sm font-medium text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]"
        />
      </div>
      {/* type selector */}
      <div className="flex gap-1.5">
        {TYPES.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setDraft(d => ({ ...d, type: t.key }))}
            className="text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
            style={draft.type === t.key
              ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' }
              : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
          >{t.emoji} {t.label}</button>
        ))}
      </div>
      {/* year */}
      <input
        type="number"
        value={draft.year || ''}
        onChange={e => setDraft(d => ({ ...d, year: e.target.value }))}
        placeholder="year"
        className="w-28 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
      />
      {/* description */}
      <textarea
        value={draft.description || ''}
        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
        rows={2}
        placeholder="what this place means to you..."
        className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
      />
      {/* tags */}
      <TagInput tags={draft.tags} onChange={t => setDraft(d => ({ ...d, tags: t }))} allTags={allTags} />
      {/* photos */}
      <PhotoUpload photos={draft.photos} onChange={p => setDraft(d => ({ ...d, photos: p }))} />
      {/* rating (visited only) */}
      {draft.type === 'visited' && (
        <div>
          <p className="text-xs text-[#a89bc2] mb-1.5">your rating</p>
          <StarRating value={draft.rating} onChange={r => setDraft(d => ({ ...d, rating: r }))} />
        </div>
      )}
      {/* footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <DeleteButton onDelete={() => onDelete(place.id)} />
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, isPublic: !d.isPublic }))}
            className="text-[10px] px-2 py-0.5 rounded-md border transition-colors"
            style={draft.isPublic
              ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' }
              : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
          >{draft.isPublic ? '✦ public' : 'private'}</button>
        </div>
        <div className="flex gap-2">
          <Button variant="quiet" onClick={() => { setEditing(false); setDraft({ ...place, photos: place.photos || [], tags: place.tags || [] }) }}>cancel</Button>
          <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
            {saving ? 'saving...' : 'save'}
          </button>
        </div>
      </div>
    </div>
  )

  const photos = place.photos || []
  const tags   = place.tags   || []

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl px-4 py-3 group relative">
      {/* public dot */}
      {place.isPublic && (
        <span className="absolute top-3 right-10 text-[9px] text-[#c4b5fd]" title="visible on your public profile">✦</span>
      )}
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>edit</Button>

      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 shrink-0">{place.emoji || '📍'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#2d2a35]">{place.name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {place.year && <span className="text-[11px] text-[#c4b8d9]">{place.year}</span>}
            {place.type === 'visited' && place.rating && (
              <StarRating value={place.rating} readOnly />
            )}
          </div>
          {place.description && <p className="text-xs text-[#7c6f9b] mt-1 leading-relaxed">{place.description}</p>}
          <PhotoStrip photos={photos} />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ background: tagColor(t, allTags) }}
                >{t}</span>
              ))}
            </div>
          )}
          {place.season && (
            <div className="mt-1.5">
              <SeasonBadge season={place.season} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add form ──────────────────────────────────────────────────
function AddForm({ type, allTags, onCommit, onCancel, seasonId }) {
  const [draft, setDraft] = useState({
    name: '', description: '', emoji: '', year: '',
    tags: [], photos: [], rating: null, isPublic: false,
  })
  const [saving, setSaving] = useState(false)

  const commit = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    try {
      const res = await axios.post('/api/places', { ...draft, type, seasonId: seasonId || null })
      onCommit(res.data.place)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[#ede9f5] rounded-2xl p-4 mb-3 space-y-3">
      <div className="flex items-center gap-2">
        <EmojiPicker value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e }))} placeholder="📍" />
        <input
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel() }}
          placeholder="place name"
          autoFocus
          className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      </div>
      {type !== 'want' && (
        <input
          type="number"
          value={draft.year}
          onChange={e => setDraft(d => ({ ...d, year: e.target.value }))}
          placeholder="year (optional)"
          className="w-28 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      )}
      <textarea
        value={draft.description}
        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
        rows={2}
        placeholder="what this place means to you..."
        className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
      />
      <TagInput tags={draft.tags} onChange={t => setDraft(d => ({ ...d, tags: t }))} allTags={allTags} />
      <PhotoUpload photos={draft.photos} onChange={p => setDraft(d => ({ ...d, photos: p }))} />
      {type === 'visited' && (
        <div>
          <p className="text-xs text-[#a89bc2] mb-1.5">your rating</p>
          <StarRating value={draft.rating} onChange={r => setDraft(d => ({ ...d, rating: r }))} />
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setDraft(d => ({ ...d, isPublic: !d.isPublic }))}
          className="text-[10px] px-2 py-0.5 rounded-md border transition-colors"
          style={draft.isPublic
            ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' }
            : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
        >{draft.isPublic ? '✦ public' : 'private'}</button>
        <div className="flex gap-2">
          <Button variant="quiet" onClick={onCancel}>cancel</Button>
          <button
            onClick={commit}
            disabled={saving || !draft.name.trim()}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-40 transition-colors"
          >{saving ? 'saving...' : 'add'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function PlacesPage() {
  const { user } = useAuth()
  const [places, setPlaces]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(null)   // 'lived'|'visited'|'want'|null
  const [filterType, setFilterType] = useState(null)
  const [filterTag, setFilterTag]   = useState(null)
  const [search, setSearch]         = useState('')
  const [activeSeason, setActiveSeason] = useState(null)

  useEffect(() => {
    axios.get('/api/places').then(res => setPlaces(res.data.places)).finally(() => setLoading(false))
    axios.get('/api/seasons/active').then(r => setActiveSeason(r.data.season)).catch(() => {})
  }, [])

  const allTags = [...new Set(places.flatMap(p => p.tags || []))]

  const visible = places.filter(p => {
    if (filterType && p.type !== filterType) return false
    if (filterTag  && !(p.tags || []).includes(filterTag)) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addPlace  = (place) => { setPlaces(prev => [...prev, place]); setAdding(null) }
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

  const hasAnyFilter = filterType || filterTag || search

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* header */}
        <div className="flex items-center justify-between mb-1">
          <BackLink to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">← your page</BackLink>
        </div>
        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>places</h1>
        <p className="text-sm text-[#a89bc2] mb-6">the places that made you, and the ones still waiting</p>

        {/* ── FILTER BAR ── */}
        {places.length > 0 && (
          <div className="mb-8 space-y-3">
            {/* search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="search places..."
              className="w-full text-sm text-[#2d2a35] bg-white border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
            />
            {/* type filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType(null)}
                className="text-[11px] px-3 py-1 rounded-full border transition-colors"
                style={!filterType
                  ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' }
                  : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)', background: 'var(--sp-surface)' }}
              >all</button>
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilterType(prev => prev === t.key ? null : t.key)}
                  className="text-[11px] px-3 py-1 rounded-full border transition-colors"
                  style={filterType === t.key
                    ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd66' }
                    : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)', background: 'var(--sp-surface)' }}
                >{t.emoji} {t.label}</button>
              ))}
            </div>
            {/* tag filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filterTag && (
                  <button
                    onClick={() => setFilterTag(null)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full border text-[#c4b8d9] border-[#e4dff0] bg-white"
                  >clear tag ✕</button>
                )}
                {allTags.map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterTag(prev => prev === t ? null : t)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full transition-colors"
                    style={filterTag === t
                      ? { background: tagColor(t, allTags), color: 'white' }
                      : { background: `${tagColor(t, allTags)}22`, color: tagColor(t, allTags), border: `1px solid ${tagColor(t, allTags)}55` }}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONTENT ── */}
        {hasAnyFilter ? (
          /* flat filtered view */
          <div>
            {visible.length === 0
              ? <p className="text-sm text-[#c4b8d9] text-center py-8">no places match your filters</p>
              : (
                <div className="space-y-2">
                  {visible.map(p => (
                    <PlaceCard key={p.id} place={p} allTags={allTags} onUpdate={updatePlace} onDelete={deletePlace} />
                  ))}
                </div>
              )
            }
          </div>
        ) : (
          /* grouped by type */
          <div className="space-y-10">
            {TYPES.map(({ key, long, emoji }) => {
              const section = places.filter(p => p.type === key)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <p className="text-sm font-medium text-[#2d2a35]">{long}</p>
                      {section.length > 0 && (
                        <span className="text-[10px] text-[#c4b8d9]">({section.length})</span>
                      )}
                    </div>
                    <button
                      onClick={() => setAdding(prev => prev === key ? null : key)}
                      className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors"
                    >{adding === key ? 'cancel' : '+ add'}</button>
                  </div>

                  {adding === key && (
                    <AddForm
                      type={key}
                      allTags={allTags}
                      onCommit={addPlace}
                      onCancel={() => setAdding(null)}
                      seasonId={activeSeason?.id}
                    />
                  )}

                  {section.length === 0 && adding !== key
                    ? <p className="text-xs text-[#d4cfe3] italic px-1">none yet</p>
                    : (
                      <div className="space-y-2 stagger-children">
                        {section.map(p => (
                          <PlaceCard key={p.id} place={p} allTags={allTags} onUpdate={updatePlace} onDelete={deletePlace} />
                        ))}
                      </div>
                    )
                  }
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
