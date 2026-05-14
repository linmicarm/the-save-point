import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function MediaSearch({ type, value, onChange, label }) {
  const [query, setQuery]     = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const timerRef    = useRef(null)
  const containerRef = useRef(null)

  // keep input in sync when parent resets
  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    clearTimeout(timerRef.current)
    const trimmed = query.trim()
    if (!trimmed || trimmed === value) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await axios.get(`/api/media/search?type=${type}&q=${encodeURIComponent(trimmed)}`)
        setResults(res.data.results || [])
        setOpen((res.data.results || []).length > 0)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setBusy(false)
      }
    }, 320)
    return () => clearTimeout(timerRef.current)
  }, [query, type, value])

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (title) => {
    onChange(title)
    setQuery(title)
    setOpen(false)
    setResults([])
  }

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    onChange(v)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5">
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={`what are you ${label}?`}
          className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#c4b8d9]"
        />
        {busy && (
          <span className="text-[10px] text-[#c4b8d9] shrink-0 animate-pulse">···</span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e4dff0] rounded-xl shadow-lg z-30 overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); select(r.title) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#faf8ff] transition-colors text-left"
            >
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shrink-0 bg-[#f0edf8]"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#f0edf8] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2d2a35] truncate leading-snug">{r.title}</p>
                {r.subtitle && (
                  <p className="text-[11px] text-[#a89bc2] truncate">{r.subtitle}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
