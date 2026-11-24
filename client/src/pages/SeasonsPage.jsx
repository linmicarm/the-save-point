import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeasonModal from '../components/SeasonModal'

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

function SeasonCard({ season, onUpdate }) {
  const [editing, setEditing]       = useState(false)
  const [reflection, setReflection] = useState(season.reflection || '')
  const [saving, setSaving]         = useState(false)
  const isActive = !season.endedAt

  const saveReflection = async () => {
    setSaving(true)
    try {
      const res = await axios.patch(`/api/seasons/${season.id}`, { reflection })
      onUpdate(res.data.season)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${season.color}44`, background: isActive ? `${season.color}08` : 'white' }}
    >
      {/* color bar */}
      <div className="h-1 w-full" style={{ background: season.color }} />

      <div className="p-5">
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{season.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {season.name}
                </h3>
                {isActive && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ background: season.color }}>
                    active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#c4b8d9] mt-0.5">{formatDateRange(season.startedAt, season.endedAt)}</p>
            </div>
          </div>
          <span className="text-[11px] text-[#c4b8d9] mt-1">{duration(season.startedAt, season.endedAt)}</span>
        </div>

        {season.intention && (
          <p className="text-xs text-[#7c6f9b] italic mb-3 pl-10">"{season.intention}"</p>
        )}

        {/* reflection */}
        <div className="pl-10">
          {editing ? (
            <div>
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="looking back, what defined this season for you?"
                rows={3}
                autoFocus
                className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveReflection}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'saving...' : 'save'}
                </button>
                <button onClick={() => { setEditing(false); setReflection(season.reflection || '') }} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
                  cancel
                </button>
              </div>
            </div>
          ) : season.reflection ? (
            <div>
              <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">{season.reflection}</p>
              <button onClick={() => setEditing(true)} className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] mt-2 transition-colors">
                edit reflection
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors italic"
            >
              + add a reflection
            </button>
          )}

          {/* closing ceremony words */}
          {(season.carryForward || season.released) && (
            <div className="mt-4 pt-3 border-t border-[#f0ecfa] space-y-2.5">
              {season.carryForward && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#c4b8d9] mb-0.5">carried forward</p>
                  <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">{season.carryForward}</p>
                </div>
              )}
              {season.released && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#c4b8d9] mb-0.5">let go</p>
                  <p className="text-sm text-[#5a5065] leading-relaxed whitespace-pre-wrap">{season.released}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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

  const updateSeason = (updated) => {
    setSeasons(prev => prev.map(s => s.id === updated.id ? updated : s))
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
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors"
          >
            {activeSeason ? 'manage season' : '+ new season'}
          </button>
        </div>

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          seasons
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">chapters of your life, one at a time</p>

        {seasons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✦</p>
            <p className="text-sm text-[#a89bc2] mb-6">no seasons yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] transition-colors"
            >
              begin your first season
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {seasons.map(season => (
              <SeasonCard key={season.id} season={season} onUpdate={updateSeason} />
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
