import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeasonModal from '../components/SeasonModal'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

function formatDateRange(startedAt, endedAt) {
  const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  if (!endedAt) return `${fmt(startedAt)} — ongoing`
  return `${fmt(startedAt)} — ${fmt(endedAt)}`
}

function duration(startedAt, endedAt) {
  const ms = new Date(endedAt || Date.now()) - new Date(startedAt)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days < 7)  return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

// A whole card is one big tap target that opens the season.
function SeasonCard({ season }) {
  const isActive = !season.endedAt
  return (
    <Link
      to={`/seasons/${season.id}`}
      className="block rounded-2xl border overflow-hidden transition-all hover:shadow-md"
      style={{ borderColor: `${season.color}55`, background: isActive ? `${season.color}12` : 'var(--sp-surface)' }}
    >
      <div className="h-1 w-full" style={{ background: season.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{season.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
                  {season.name}
                </h3>
                {isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: season.color, color: '#2d2a35' }}>
                    current
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sp-text-faint)' }}>
                {formatDateRange(season.startedAt, season.endedAt)} · {duration(season.startedAt, season.endedAt)}
              </p>
            </div>
          </div>
          <span className="text-lg leading-none mt-1" style={{ color: 'var(--sp-text-faint)' }} aria-hidden>›</span>
        </div>
        {season.intention && (
          <p className="text-sm italic mt-3 leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
            "{season.intention}"
          </p>
        )}
      </div>
    </Link>
  )
}

export default function SeasonsPage() {
  const { user } = useAuth()
  const [seasons, setSeasons]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)

  useEffect(() => {
    axios.get('/api/seasons')
      .then(res => setSeasons(res.data.seasons))
      .finally(() => setLoading(false))
  }, [])

  const activeSeason = seasons.find(s => !s.endedAt) || null

  const handleModalSave = (_updated) => {
    setShowModal(false)
    axios.get('/api/seasons')
      .then(res => setSeasons(res.data.seasons))
  }



  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your seasons...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* nav */}
        <div className="flex items-center justify-between mb-8">
          <BackLink to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </BackLink>
          <Button size="sm" onClick={() => setShowModal(true)}>
            {activeSeason ? 'manage season' : '+ new season'}
          </Button>
        </div>

        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
          seasons
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">chapters of your life, one at a time</p>

        {seasons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✦</p>
            <p className="text-sm text-[#a89bc2] mb-6">no seasons yet</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>begin your first season</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {seasons.map(season => (
              <SeasonCard key={season.id} season={season} />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>

      {showModal && (
        <SeasonModal
          season={activeSeason}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
