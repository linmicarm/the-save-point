import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const FIELDS = [
  { key: 'theme',      label: 'theme',          list: false },
  { key: 'highlight',  label: 'highlight',      list: false },
  { key: 'focus',      label: 'focus',          list: false },
  { key: 'foods',      label: 'foods & drinks', list: true },
  { key: 'selfCare',   label: 'self-care',      list: true },
  { key: 'activities', label: 'activities',     list: true },
  { key: 'media',      label: 'media',          list: true },
  { key: 'other',      label: 'other',          list: true },
]

const toLines = (str) => str ? str.split('\n').filter(Boolean) : []

export default function MonthPublicPage() {
  const { username, year, month } = useParams()
  const [entry, setEntry]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    axios.get(`/api/months/public/${username}`)
      .then(res => {
        const found = res.data.entries.find(
          e => e.year === Number(year) && e.month === Number(month)
        )
        if (!found) setNotFound(true)
        else setEntry(found)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username, year, month])

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center gap-3">
      <p className="text-2xl">✦</p>
      <p className="text-sm text-[#a89bc2]">this month hasn't been shared</p>
      <Link to={`/u/${username}`} className="text-xs text-[#c4b5fd] hover:text-[#b39ef7] transition-colors">
        visit {username}'s page
      </Link>
    </div>
  )

  const monthLabel = `${MONTH_NAMES[entry.month - 1]} ${entry.year}`

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← {username}
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{entry.mood || '✦'}</span>
          <h1 className="text-2xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
            {monthLabel}
          </h1>
        </div>
        {entry.theme && (
          <p className="text-sm text-[#a89bc2] italic mb-8 ml-10">{entry.theme}</p>
        )}
        {!entry.theme && <div className="mb-8" />}

        {entry.photoUrl && (
          <button
            type="button"
            onClick={() => setLightbox(entry.photoUrl)}
            className="w-full mb-8 block rounded-2xl overflow-hidden group focus:outline-none"
          >
            <img
              src={entry.photoUrl}
              alt={monthLabel}
              className="w-full object-contain group-hover:opacity-95 transition-opacity"
              onError={e => e.target.closest('button').style.display = 'none'}
            />
          </button>
        )}

        <div className="space-y-6">
          {FIELDS.map(({ key, label, list }) => entry[key] ? (
            <div key={key}>
              <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-1.5">{label}</p>
              {list ? (
                <ul className="space-y-1">
                  {toLines(entry[key]).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#5a5065]">
                      <span className="text-[#c4b5fd] mt-0.5 shrink-0">•</span>
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#5a5065] leading-relaxed">{entry[key]}</p>
              )}
            </div>
          ) : null)}
        </div>

        <p className="text-center text-xs text-[#d4cfe3] mt-16">✦ the save point</p>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(20,18,26,0.85)' }}
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-white/60 hover:text-white text-2xl leading-none transition-colors">✕</button>
          <img
            src={lightbox}
            alt={monthLabel}
            className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
