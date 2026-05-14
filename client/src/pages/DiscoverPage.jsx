import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const CURRENTLY_LABELS = [
  { key: 'watching',  label: 'watching',  emoji: '📺' },
  { key: 'reading',   label: 'reading',   emoji: '📖' },
  { key: 'playing',   label: 'playing',   emoji: '🎮' },
  { key: 'listening', label: 'listening', emoji: '🎧' },
  { key: 'eating',    label: 'eating',    emoji: '🍜' },
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function SeasonCard({ user }) {
  const { season, displayName, username, accentColor } = user
  const color = season?.color || accentColor || '#c4b5fd'
  const rgb = hexToRgb(color)

  return (
    <Link to={`/u/${username}`} className="block group">
      <div className="rounded-2xl overflow-hidden border border-[#ede9f5] hover:shadow-md transition-shadow">
        {/* cover */}
        <div
          className="h-36 relative flex items-end"
          style={season?.coverUrl
            ? { backgroundImage: `url(${season.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: `linear-gradient(135deg, rgba(${rgb}, 0.3) 0%, rgba(${rgb}, 0.1) 100%)` }
          }
        >
          {season?.coverUrl && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />}
          <div className="relative px-3 pb-2.5 w-full">
            {season && (
              <div className="flex items-center gap-1.5">
                <span className="text-base">{season.emoji}</span>
                <span className="text-xs font-medium text-white drop-shadow">{season.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* info */}
        <div className="bg-white px-3 py-2.5">
          <p className="text-sm font-medium text-[#2d2a35]">{displayName}</p>
          <p className="text-[11px]" style={{ color }}>@{username}</p>
          {season?.intention && (
            <p className="text-[11px] text-[#a89bc2] mt-1 leading-snug line-clamp-2">{season.intention}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function DiscoverPage() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('seasons')

  useEffect(() => {
    axios.get('/api/discover')
      .then(res => setUsers(res.data.users))
      .finally(() => setLoading(false))
  }, [])

  // build activity feed: { key, emoji, label, entries: [{value, username, displayName}] }
  const activityFeed = CURRENTLY_LABELS.map(({ key, label, emoji }) => ({
    key, label, emoji,
    entries: users
      .filter(u => u.currently[key])
      .map(u => ({ value: u.currently[key], username: u.username, displayName: u.displayName, color: u.season?.color || u.accentColor || '#c4b5fd' })),
  })).filter(f => f.entries.length > 0)

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>discover</h1>
        <p className="text-sm text-[#a89bc2] mb-6">see what others are doing this season</p>

        {/* tab toggle */}
        <div className="flex gap-1 mb-6 border-b border-[#e4dff0]">
          {[{ key: 'seasons', label: 'seasons' }, { key: 'activity', label: 'what people are into' }].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="text-xs px-4 py-2 rounded-t-xl border-t border-l border-r transition-all whitespace-nowrap relative"
              style={activeTab === t.key ? {
                background: 'white', borderColor: '#e4dff0', color: '#2d2a35', fontWeight: 500, bottom: '-2px', paddingBottom: '10px',
              } : {
                background: 'rgba(196, 181, 253, 0.06)', borderColor: '#ede9f5', color: '#a89bc2',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">✦</p>
            <p className="text-sm text-[#a89bc2] mb-2">no one here yet</p>
            <p className="text-xs text-[#c4b8d9]">turn on "appear on discover" in your profile settings to be the first</p>
          </div>
        ) : (
          <>
            {activeTab === 'seasons' && (
              <div className="grid grid-cols-2 gap-3 stagger-children">
                {users.filter(u => u.season).map(u => <SeasonCard key={u.username} user={u} />)}
                {users.filter(u => !u.season).map(u => <SeasonCard key={u.username} user={u} />)}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6 stagger-children">
                {activityFeed.map(({ key, label, emoji, entries }) => (
                  <div key={key}>
                    <p className="text-[10px] text-[#a89bc2] uppercase tracking-widest mb-3">{emoji} {label}</p>
                    <div className="space-y-2">
                      {entries.map(e => (
                        <Link key={e.username} to={`/u/${e.username}`} className="flex items-start gap-3 bg-white border border-[#ede9f5] rounded-2xl px-4 py-3 hover:shadow-sm transition-shadow">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0 mt-0.5" style={{ background: e.color }}>
                            {e.displayName?.[0]?.toUpperCase() || '✦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#a89bc2]">{e.displayName}</p>
                            <p className="text-sm text-[#2d2a35] leading-snug">{e.value}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}
