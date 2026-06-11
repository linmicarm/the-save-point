import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

async function itunesWatching(q) {
  const [movRes, tvRes] = await Promise.all([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&entity=movie&limit=4`),
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=tvShow&entity=tvSeason&limit=4`),
  ])
  const [mov, tv] = await Promise.all([movRes.json(), tvRes.json()])
  return [
    ...(mov.results || []).map(r => ({
      title: r.trackName,
      subtitle: [r.primaryGenreName, r.releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
      imageUrl: r.artworkUrl100,
    })),
    ...(tv.results || []).map(r => ({
      title: r.collectionName || r.trackName,
      subtitle: ['TV Series', r.releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
      imageUrl: r.artworkUrl100,
    })),
  ].slice(0, 8)
}

async function searchByType(type, q) {
  // watching: try TMDB via server first, fall back to iTunes
  if (type === 'watching') {
    const { data } = await axios.get(`/api/media/search?type=watching&q=${encodeURIComponent(q)}`)
    if (!data.fallback && data.results.length > 0) return data.results
    return itunesWatching(q)
  }
  // reading: Open Library (browser, free, no key)
  if (type === 'reading') {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,first_publish_year,cover_i`)
    const data = await res.json()
    return (data.docs || []).slice(0, 8).map(r => ({
      title: r.title,
      subtitle: [r.author_name?.[0], r.first_publish_year].filter(Boolean).join(' · '),
      imageUrl: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg` : null,
    }))
  }
  // listening: iTunes (browser)
  if (type === 'listening') {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8`)
    const data = await res.json()
    return (data.results || []).map(r => ({
      title: `${r.trackName} — ${r.artistName}`,
      subtitle: r.collectionName,
      imageUrl: r.artworkUrl100,
    }))
  }
  // playing: RAWG via server
  if (type === 'playing') {
    const { data } = await axios.get(`/api/media/search?type=playing&q=${encodeURIComponent(q)}`)
    return data.results || []
  }
  return []
}

export default function MediaSearch({ type, value, onChange, label, onBlur, onCommit, autoFocus }) {
  const [query, setQuery]     = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const timerRef     = useRef(null)
  const containerRef = useRef(null)
  const skipRef      = useRef(false)

  useEffect(() => {
    if (!value) { setQuery(''); setResults([]); setOpen(false) }
  }, [value])

  useEffect(() => {
    clearTimeout(timerRef.current)
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setOpen(false); return }
    if (skipRef.current) { skipRef.current = false; return }

    timerRef.current = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await searchByType(type, trimmed)
        setResults(res)
        setOpen(res.length > 0)
      } catch {
        setResults([]); setOpen(false)
      } finally {
        setBusy(false)
      }
    }, 320)
    return () => clearTimeout(timerRef.current)
  }, [query, type])

  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (result) => {
    skipRef.current = true
    onChange(result.title)
    setQuery(result.title)
    setOpen(false)
    setResults([])
    onCommit?.(result)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => !open && onBlur?.(query)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !open) { e.target.blur(); onBlur?.(query) }
            if (e.key === 'Escape') { setOpen(false); onBlur?.(query) }
          }}
          placeholder={`search ${label}...`}
          className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#c4b8d9]"
        />
        {busy && <span className="text-[10px] text-[#c4b8d9] shrink-0 animate-pulse">···</span>}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e4dff0] rounded-xl shadow-lg z-30 overflow-hidden max-h-72 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={e => { e.preventDefault(); select(r) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#faf8ff] transition-colors text-left"
            >
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0 bg-[#f0edf8]" onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <div className="w-10 h-14 rounded-lg bg-[#f0edf8] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2d2a35] leading-snug">{r.title}</p>
                {r.subtitle && <p className="text-[11px] text-[#a89bc2] truncate">{r.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
