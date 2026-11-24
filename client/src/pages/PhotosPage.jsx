import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { uploadImage } from '../utils/uploadImage'
import SeasonBadge from '../components/SeasonBadge'
import Button from '../components/Button'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PhotoCard({ photo, onClick }) {
  return (
    <div
      className="break-inside-avoid mb-3 rounded-xl overflow-hidden cursor-pointer group relative"
      onClick={() => onClick(photo)}
    >
      <img
        src={photo.url}
        alt={photo.caption || ''}
        className="w-full object-cover block"
        loading="lazy"
      />
      {/* hover overlay */}
      <div className="absolute inset-0 bg-[#2d2a35]/0 group-hover:bg-[#2d2a35]/40 transition-all flex flex-col justify-end p-3">
        <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          {photo.season && (
            <div className="mb-1" onClick={e => e.stopPropagation()}>
              <SeasonBadge season={photo.season} />
            </div>
          )}
          {photo.caption && (
            <p className="text-white text-xs leading-relaxed font-medium line-clamp-2">{photo.caption}</p>
          )}
          {photo.takenAt && (
            <p className="text-white/70 text-[10px] mt-0.5">{fmtDate(photo.takenAt)}</p>
          )}
        </div>
      </div>
      {/* date chip */}
      {photo.takenAt && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {fmtDate(photo.takenAt)}
          </span>
        </div>
      )}
    </div>
  )
}

function Lightbox({ photo, accent, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(photo.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const accentRgb = hexToRgb(accent)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2a35]/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4dff0] shrink-0">
          <div>
            {photo.takenAt && (
              <p className="text-xs text-[#a89bc2]">{fmtDate(photo.takenAt)}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-[#d4cfe3] hover:text-rose-400 transition-colors disabled:opacity-40"
            >
              {deleting ? 'deleting…' : '🗑 delete'}
            </button>
            <button
              onClick={onClose}
              className="text-[#c4b8d9] hover:text-[#a89bc2] transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* image */}
        <div className="flex-1 overflow-y-auto">
          <img
            src={photo.url}
            alt={photo.caption || ''}
            className="w-full object-contain max-h-[60vh]"
          />
          {/* caption + tags */}
          <div className="px-5 py-4 space-y-2">
            {photo.caption && (
              <p className="text-sm text-[#3d3545] leading-relaxed">{photo.caption}</p>
            )}
            {photo.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {photo.tags.map(t => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `rgba(${accentRgb}, 0.12)`, color: accent }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadForm({ accent, onUpload, onCancel }) {
  const [preview, setPreview] = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const accentRgb = hexToRgb(accent)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'photos')
      setUploadedUrl(url)
      setPreview(url)
    } catch {
      // ignore upload errors silently
    } finally {
      setUploading(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!uploadedUrl) return
    setSaving(true)
    try {
      await onUpload({ url: uploadedUrl, caption: caption.trim() || null, takenAt: takenAt || null, tags })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white border border-[#e4dff0] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>upload photo</p>
        <button type="button" onClick={onCancel} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
      </div>

      {/* drop zone */}
      {preview ? (
        <div className="relative">
          <img src={preview} alt="preview" className="w-full max-h-64 object-cover rounded-xl" />
          <Button variant="secondary" size="sm" type="button" onClick={() => { setPreview(null); setUploadedUrl(null); if (fileRef.current) fileRef.current.value = '' }}>change</Button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#e4dff0] rounded-xl p-8 text-center cursor-pointer hover:border-[#c4b5fd] transition-colors"
        >
          {uploading ? (
            <p className="text-xs text-[#a89bc2]">uploading…</p>
          ) : (
            <>
              <p className="text-2xl mb-2">📷</p>
              <p className="text-xs text-[#a89bc2]">click to choose a photo</p>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <input
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="caption (optional)…"
        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
      />

      <input
        type="date"
        value={takenAt}
        onChange={e => setTakenAt(e.target.value)}
        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2]"
      />

      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `rgba(${accentRgb}, 0.12)`, color: accent }}>
              {t}
              <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="opacity-70 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder="add tag, press Enter"
          className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="quiet" type="button" onClick={onCancel}>cancel</Button>
        <button
          type="submit"
          disabled={saving || uploading || !uploadedUrl}
          className="text-xs px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: accent }}
        >
          {uploading ? 'uploading…' : saving ? 'saving…' : 'upload'}
        </button>
      </div>
    </form>
  )
}

export default function PhotosPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [activeSeason, setActiveSeason] = useState(null)

  const accent = user?.accentColor || '#c4b5fd'

  useEffect(() => {
    axios.get('/api/photos')
      .then(res => setPhotos(res.data.photos || res.data || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
    axios.get('/api/seasons/active')
      .then(r => setActiveSeason(r.data.season || null))
      .catch(() => {})
  }, [])

  const handleUpload = async (data) => {
    try {
      const res = await axios.post('/api/photos', { ...data, seasonId: activeSeason?.id || null })
      setPhotos(prev => [res.data.photo || res.data, ...prev])
      setShowUploadForm(false)
      showToast('photo saved', 'success')
    } catch {
      showToast('could not upload photo', 'error')
      throw new Error('failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/photos/${id}`)
      setPhotos(prev => prev.filter(p => p.id !== id))
      showToast('photo deleted', 'success')
    } catch {
      showToast('could not delete photo', 'error')
      throw new Error('failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
              photos
            </h1>
            <p className="text-sm text-[#a89bc2] mt-1">your photo memories</p>
          </div>
          <button
            onClick={() => setShowUploadForm(v => !v)}
            className="text-xs px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90 shrink-0"
            style={{ background: accent }}
          >
            + upload
          </button>
        </div>

        {/* upload form */}
        {showUploadForm && (
          <div className="mb-6 max-w-md">
            <UploadForm accent={accent} onUpload={handleUpload} onCancel={() => setShowUploadForm(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : photos.length === 0 && !showUploadForm ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-sm text-[#a89bc2] mb-6">capture your memories</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="text-xs px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              upload your first photo
            </button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                accent={accent}
                onClick={setLightboxPhoto}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          accent={accent}
          onClose={() => setLightboxPhoto(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
