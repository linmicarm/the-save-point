import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PublicPhotoCard({ photo, onClick }) {
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
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex flex-col justify-end p-3">
        <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          {photo.caption && (
            <p className="text-white text-xs leading-relaxed font-medium line-clamp-2">{photo.caption}</p>
          )}
          {photo.takenAt && (
            <p className="text-white/70 text-[10px] mt-0.5">{fmtDate(photo.takenAt)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PublicLightbox({ photo, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,25,40,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        style={{ background: 'var(--sp-surface)' }}
      >
        {/* top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--sp-border)' }}
        >
          <div>
            {photo.takenAt && (
              <p className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>{fmtDate(photo.takenAt)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="transition-opacity hover:opacity-60 text-lg leading-none"
            style={{ color: 'var(--sp-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* image */}
        <div className="flex-1 overflow-y-auto">
          <img
            src={photo.url}
            alt={photo.caption || ''}
            className="w-full object-contain max-h-[60vh]"
          />
          {photo.caption && (
            <div className="px-5 py-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sp-text)' }}>{photo.caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PublicPhotosPage() {
  const { username } = useParams()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    axios.get(`/api/photos/public/${username}`)
      .then(res => setPhotos(res.data.photos || res.data || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [username])

  return (
    <div className="min-h-screen" style={{ background: 'var(--sp-bg)' }}>
      <div className="max-w-5xl mx-auto px-5 py-8">

        <div className="mb-8">
          <h1
            className="text-2xl font-medium"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text)' }}
          >
            {username}'s photos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sp-text-muted)' }}>
            a collection of memories
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-center py-16" style={{ color: 'var(--sp-text-muted)' }}>loading...</p>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>no public photos yet</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map(photo => (
              <PublicPhotoCard
                key={photo.id}
                photo={photo}
                onClick={setLightboxPhoto}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxPhoto && (
        <PublicLightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  )
}
