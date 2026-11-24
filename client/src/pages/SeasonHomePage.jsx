import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import WeatherCheckIn from '../components/WeatherCheckIn'
import SeasonModal from '../components/SeasonModal'

// Private "today" home — everything revolves around the season you're in.
// Nothing here is public, ranked or compared: it's just for you.

const label = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }
const card = {
  background: 'var(--sp-surface)',
  border: '1px solid var(--sp-border)',
  boxShadow: '0 1px 6px rgba(59,47,47,0.04)',
}

function dayOfSeason(startedAt) {
  const ms = Date.now() - new Date(startedAt).getTime()
  return Math.max(1, Math.floor(ms / 86400000) + 1)
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
}

export default function SeasonHomePage() {
  const { user } = useAuth()
  const [season, setSeason]       = useState(null)
  const [prompt, setPrompt]       = useState('')
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get('/api/seasons/active'),
      axios.get('/api/journal/prompt'),
      axios.get('/api/journal', { params: { limit: 2 } }),
    ]).then(([s, p, e]) => {
      setSeason(s.data.season)
      setPrompt(p.data.prompt)
      setEntries(e.data.entries)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSeasonSaved = (s) => {
    setSeason(s)            // null when a season was ended without starting a new one
    setShowModal(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm animate-pulse" style={label}>✦</p>
    </div>
  )

  const accent = season?.color || '#c4b5fd'

  return (
    <div className="min-h-screen" style={{ background: 'var(--sp-bg)' }}>
      <div className="h-1 w-full" style={{ background: accent }} />
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* season header */}
        {season ? (
          <header className="mb-8">
            <p className="text-3xl mb-2 leading-none">{season.emoji}</p>
            <h1
              className="text-2xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}
            >
              {season.name}
            </h1>
            <p className="text-sm" style={label}>day {dayOfSeason(season.startedAt)}</p>
            {season.intention && (
              <p
                className="text-sm italic mt-3 leading-relaxed"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}
              >
                "{season.intention}"
              </p>
            )}
          </header>
        ) : (
          <header className="rounded-2xl p-6 mb-8 text-center" style={card}>
            <p className="text-2xl mb-2">✦</p>
            <h1
              className="text-lg mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}
            >
              what season are you in?
            </h1>
            <p className="text-sm mb-5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
              a new city, a new job, a fresh start — name it, and the rest of your save point grows around it.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-4 py-2 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              begin a season
            </button>
          </header>
        )}

        {/* weather */}
        <WeatherCheckIn />

        {/* today's prompt — a doorway to the journal, not a form */}
        <Link
          to="/journal"
          className="block rounded-2xl p-4 mb-6 transition-opacity hover:opacity-90"
          style={card}
        >
          <p className="text-[11px] mb-1.5 uppercase tracking-widest" style={label}>today's prompt</p>
          <p
            className="text-sm leading-relaxed italic"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}
          >
            "{prompt}"
          </p>
          <p className="text-xs mt-2" style={label}>write →</p>
        </Link>

        {/* recently */}
        {entries.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest" style={label}>recently</p>
              <Link to="/journal" className="text-xs hover:opacity-70 transition-opacity" style={label}>
                all entries
              </Link>
            </div>
            <div className="space-y-2">
              {entries.map(e => (
                <Link
                  key={e.id}
                  to="/journal"
                  className="flex items-start gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
                  style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border-faint)' }}
                >
                  <span className="text-[11px] shrink-0 pt-0.5" style={label}>{shortDate(e.createdAt)}</span>
                  <span
                    className="text-sm leading-snug"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}
                  >
                    {e.mood && <span className="mr-1.5">{e.mood}</span>}
                    {e.body.length > 110 ? `${e.body.slice(0, 110)}…` : e.body}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* footer links — quiet on purpose */}
        <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid var(--sp-border-faint)' }}>
          <Link to={`/u/${user.username}`} className="text-xs hover:opacity-70 transition-opacity" style={label}>
            your page
          </Link>
          {season && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs hover:opacity-70 transition-opacity"
              style={label}
            >
              edit or end this season
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <SeasonModal
          season={season}
          onClose={() => setShowModal(false)}
          onSave={handleSeasonSaved}
        />
      )}
    </div>
  )
}
