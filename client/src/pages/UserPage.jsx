import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeasonBadge from '../components/SeasonBadge'
import SeasonModal from '../components/SeasonModal'
import MediaSearch from '../components/MediaSearch'
import { useToast } from '../contexts/ToastContext'

const ACCENT_PRESETS = [
  { label: 'lavender', value: '#c4b5fd' },
  { label: 'rose',     value: '#fda4af' },
  { label: 'sage',     value: '#86efac' },
  { label: 'peach',    value: '#fdba74' },
  { label: 'sky',      value: '#93c5fd' },
  { label: 'wheat',    value: '#d4b896' },
]

const CURRENTLY_FIELDS = [
  { key: 'currentlyWatching',  label: 'watching',  emoji: '📺' },
  { key: 'currentlyReading',   label: 'reading',   emoji: '📖' },
  { key: 'currentlyPlaying',   label: 'playing',   emoji: '🎮' },
  { key: 'currentlyListening', label: 'listening', emoji: '🎧' },
  { key: 'currentlyEating',    label: 'eating',    emoji: '🍜' },
]

const TAB_GROUPS = [
  { group: 'present', tabs: [
    { to: '/now',     label: 'now' },
    { to: '/journal', label: 'journal' },
    { to: '/week',    label: 'week' },
  ]},
  { group: 'time', tabs: [
    { to: '/seasons', label: 'seasons' },
    { to: '/month',   label: 'month' },
    { to: '/year',    label: 'year' },
  ]},
  { group: 'memory', tabs: [
    { to: '/milestones',  label: 'milestones' },
    { to: '/traditions',  label: 'traditions' },
    { to: '/letters',     label: 'letters' },
    { to: '/capsule',     label: 'capsule' },
  ]},
  { group: 'collect', tabs: [
    { to: '/commonplace', label: 'commonplace' },
    { to: '/places',      label: 'places' },
    { to: '/wishlist',    label: 'wishlist' },
  ]},
]

function TabNav({ accentRgb, accent, location }) {
  const initial = TAB_GROUPS.find(g => g.tabs.some(t => t.to === location.pathname))?.group || 'present'
  const [activeGroup, setActiveGroup] = useState(initial)
  const groupObj = TAB_GROUPS.find(g => g.group === activeGroup)
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TAB_GROUPS.map(({ group }) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className="text-[10px] px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
            style={group === activeGroup ? {
              background: `rgba(${accentRgb}, 0.12)`,
              color: accent,
              fontWeight: 500,
            } : {
              background: 'transparent',
              color: '#c4b8d9',
            }}
          >
            {group}
          </button>
        ))}
      </div>
      <div className="flex gap-x-0.5 border-b-2 border-[#e4dff0] overflow-x-auto scrollbar-hide">
        {groupObj.tabs.map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className="relative text-xs px-3 py-2 rounded-t-xl border-t border-l border-r transition-all whitespace-nowrap shrink-0"
              style={active ? {
                background: 'white',
                borderColor: '#e4dff0',
                color: '#2d2a35',
                fontWeight: 500,
                bottom: '-2px',
                paddingBottom: '10px',
              } : {
                background: `rgba(${accentRgb}, 0.06)`,
                borderColor: '#ede9f5',
                color: '#a89bc2',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function UserPage() {
  const { username } = useParams()
  const { user: authUser, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [draft, setDraft]       = useState({})
  const [season, setSeason]     = useState(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [nowEntry, setNowEntry]         = useState(null)
  const [publicMilestones, setPublicMilestones] = useState([])
  const [publicPlaces, setPublicPlaces]         = useState([])
  const [allSeasons, setAllSeasons]             = useState([])

  const isOwn = authUser?.username === username

  useEffect(() => {
    Promise.all([
      axios.get(`/api/users/${username}`),
      axios.get(`/api/seasons/user/${username}`),
    ])
      .then(([userRes, seasonRes]) => {
        setProfile(userRes.data.user)
        setSeason(seasonRes.data.season)
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    if (!isOwn) {
      axios.get(`/api/now/public/${username}`).then(res => setNowEntry(res.data.entry)).catch(() => {})
      axios.get(`/api/milestones/public/${username}`).then(res => setPublicMilestones(res.data.milestones)).catch(() => {})
      axios.get(`/api/places/public/${username}`).then(res => setPublicPlaces(res.data.places)).catch(() => {})
      axios.get(`/api/seasons/user/${username}/all`).then(res => setAllSeasons(res.data.seasons || [])).catch(() => {})
    }
  }, [username, isOwn])

  useEffect(() => {
    if (!editing) return
    const onKey = (e) => { if (e.key === 'Escape') setEditing(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const startEditing = () => {
    setDraft({
      displayName:        profile.displayName,
      bio:                profile.bio || '',
      accentColor:        profile.accentColor,
      isDiscoverable:     profile.isDiscoverable || false,
      currentlyWatching:  profile.currentlyWatching  || '',
      currentlyReading:   profile.currentlyReading   || '',
      currentlyPlaying:   profile.currentlyPlaying   || '',
      currentlyListening: profile.currentlyListening || '',
      currentlyEating:    profile.currentlyEating    || '',
    })
    setEditing(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      const res = await axios.patch('/api/users/me', draft)
      setProfile(res.data.user)
      setEditing(false)
    } catch (err) {
      showToast('could not save changes — try again')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]" style={{ fontFamily: 'var(--font-sans)' }}>
        loading...
      </p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center">
        <p className="text-3xl mb-3">✦</p>
        <p className="text-sm text-[#a89bc2]">this save point doesn't exist yet</p>
      </div>
    </div>
  )

  const accent  = editing ? draft.accentColor : profile.accentColor
  const accentRgb = hexToRgb(accent)

  const filledFields = CURRENTLY_FIELDS.filter(f =>
    editing ? true : !!profile[f.key]
  )

  const hasUnsaved = editing && JSON.stringify({
    displayName: draft.displayName,
    bio: draft.bio,
    accentColor: draft.accentColor,
    isDiscoverable: draft.isDiscoverable,
    currentlyWatching: draft.currentlyWatching,
    currentlyReading: draft.currentlyReading,
    currentlyPlaying: draft.currentlyPlaying,
    currentlyListening: draft.currentlyListening,
    currentlyEating: draft.currentlyEating,
  }) !== JSON.stringify({
    displayName: profile.displayName,
    bio: profile.bio || '',
    accentColor: profile.accentColor,
    isDiscoverable: profile.isDiscoverable || false,
    currentlyWatching: profile.currentlyWatching || '',
    currentlyReading: profile.currentlyReading || '',
    currentlyPlaying: profile.currentlyPlaying || '',
    currentlyListening: profile.currentlyListening || '',
    currentlyEating: profile.currentlyEating || '',
  })

  return (
    <div
      className="min-h-screen"
      style={{ background: `rgba(${accentRgb}, 0.04)` }}
    >
      {/* accent band at top */}
      <div className="h-1 w-full" style={{ background: accent }} />

      <div className="max-w-lg mx-auto px-5 py-12">

        {/* owner toolbar */}
        {isOwn && (
          <div className="mb-10">
            {editing ? (
              <div className="flex justify-end gap-3 py-2">
                <button onClick={() => setEditing(false)} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
                  cancel
                </button>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg text-white transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: accent }}
                >
                  {hasUnsaved && !saving && <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                  {saving ? 'saving...' : 'save changes'}
                </button>
              </div>
            ) : (
              <>
                {/* grouped nav */}
                <TabNav accentRgb={accentRgb} accent={accent} location={location} />
                {/* utility row */}
                <div className="flex justify-end flex-wrap gap-x-4 gap-y-1 pt-2">
                  <Link to="/discover" className="text-[11px] text-[#c4b8d9] hover:text-[#7c6f9b] transition-colors">
                    discover
                  </Link>
                  <button onClick={startEditing} className="text-[11px] text-[#c4b8d9] hover:text-[#7c6f9b] transition-colors">
                    edit page
                  </button>
                  <button onClick={handleLogout} className="text-[11px] text-[#c4b8d9] hover:text-[#7c6f9b] transition-colors">
                    sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* header */}
        <div className="mb-10">
          {/* avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl mb-5 shadow-sm"
            style={{ background: `rgba(${accentRgb}, 0.8)` }}
          >
            <span style={{ fontFamily: 'var(--font-serif)' }}>
              {profile.displayName?.[0]?.toUpperCase() || '✦'}
            </span>
          </div>

          {/* display name */}
          {editing ? (
            <input
              value={draft.displayName}
              onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
              className="text-3xl font-medium text-[#2d2a35] bg-transparent border-b border-[#e4dff0] focus:outline-none focus:border-[#a89bc2] w-full mb-1 pb-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            />
          ) : (
            <h1
              className="text-3xl font-medium text-[#2d2a35] mb-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {profile.displayName}
            </h1>
          )}

          {/* username + location */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <p className="text-sm font-medium" style={{ color: accent }}>
              savepoint.app/{profile.username}
            </p>
            {!isOwn && nowEntry?.location && (
              <span className="text-[11px] text-[#a89bc2] flex items-center gap-1">
                <span>·</span>
                <span>📍 {nowEntry.location}</span>
              </span>
            )}
          </div>
          <div className="mb-4">
            <SeasonBadge
              season={season}
              isOwn={isOwn}
              onClick={() => setShowSeasonModal(true)}
            />
          </div>

          {/* bio */}
          {editing ? (
            <textarea
              value={draft.bio}
              onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
              placeholder="a little about this season of your life..."
              rows={3}
              className="w-full text-sm text-[#5a5065] bg-white border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] resize-none placeholder-[#c4b8d9] leading-relaxed"
            />
          ) : profile.bio ? (
            <p className="text-[15px] text-[#5a5065] leading-relaxed">{profile.bio}</p>
          ) : isOwn ? (
            <p className="text-sm text-[#c4b8d9] italic">add a bio...</p>
          ) : null}


          {/* accent picker */}
          {editing && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-[#2d2a35] font-medium">appear on discover</p>
                  <p className="text-[10px] text-[#c4b8d9] mt-0.5">let others find your profile and season</p>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, isDiscoverable: !d.isDiscoverable }))}
                  className="text-[10px] px-2.5 py-1 rounded-lg border transition-colors"
                  style={draft.isDiscoverable ? { background: `rgba(${accentRgb}, 0.12)`, color: accent, borderColor: `rgba(${accentRgb}, 0.3)` } : { background: 'transparent', color: '#c4b8d9', borderColor: '#e4dff0' }}
                >
                  {draft.isDiscoverable ? '✦ on' : 'off'}
                </button>
              </div>
              <p className="text-xs text-[#a89bc2] mb-2.5">accent color</p>
              <div className="flex gap-2.5">
                {ACCENT_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setDraft(d => ({ ...d, accentColor: p.value }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: p.value,
                      outline: draft.accentColor === p.value ? `2px solid ${p.value}` : 'none',
                      outlineOffset: '3px',
                    }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
          <span className="text-xs" style={{ color: `rgba(${accentRgb}, 0.6)` }}>✦</span>
          <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
        </div>

        {/* currently block */}
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{ color: accent }}
          >
            currently
          </p>

          {filledFields.length === 0 && !editing ? (
            <div
              className="rounded-2xl px-5 py-8 text-center border"
              style={{
                background: `rgba(${accentRgb}, 0.04)`,
                borderColor: `rgba(${accentRgb}, 0.15)`,
              }}
            >
              <p className="text-sm text-[#c4b8d9]">
                {isOwn
                  ? 'nothing here yet — edit your page to add what you\'re into right now'
                  : 'nothing added yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {CURRENTLY_FIELDS.map(({ key, label, emoji }) => {
                const value = editing ? draft[key] : profile[key]
                if (!editing && !value) return null
                return (
                  <div
                    key={key}
                    className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 border transition-shadow hover:shadow-sm"
                    style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}
                  >
                    <span className="text-lg shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: accent }}>
                        {label}
                      </p>
                      {editing ? (
                        label === 'eating' ? (
                          <input
                            value={draft[key]}
                            onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                            placeholder={`what are you ${label}?`}
                            className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#c4b8d9]"
                          />
                        ) : (
                          <MediaSearch
                            type={label}
                            value={draft[key]}
                            onChange={v => setDraft(d => ({ ...d, [key]: v }))}
                            label={label}
                          />
                        )
                      ) : (
                        <p className="text-sm text-[#2d2a35] truncate">{value}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* public sections — visible to visitors only */}
        {!isOwn && (
          <>
            {/* now — richer inline preview */}
            {nowEntry && (
              <>
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                  <span className="text-xs" style={{ color: `rgba(${accentRgb}, 0.6)` }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                </div>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: accent }}>now</p>
                    <Link to={`/u/${username}/now`} className="text-[10px]" style={{ color: `rgba(${accentRgb}, 0.5)` }}>full page →</Link>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'focus',    label: 'focused on' },
                      { key: 'building', label: 'building' },
                      { key: 'learning', label: 'learning' },
                      { key: 'feeling',  label: 'feeling' },
                    ].filter(f => nowEntry[f.key]).map(({ key, label }) => (
                      <div key={key} className="bg-white border rounded-2xl px-4 py-3" style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}>
                        <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: accent }}>{label}</p>
                        <p className="text-sm text-[#5a5065] leading-relaxed">{nowEntry[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* milestones */}
            {publicMilestones.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                  <span className="text-xs" style={{ color: `rgba(${accentRgb}, 0.6)` }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                </div>
                <div className="mb-8">
                  <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: accent }}>milestones</p>
                  <div className="space-y-2 stagger-children">
                    {publicMilestones.slice(0, 6).map(m => (
                      <div key={m.id} className="bg-white border rounded-2xl px-4 py-3 flex items-start gap-3" style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}>
                        <span className="text-xl shrink-0 mt-0.5">{m.emoji || '✦'}</span>
                        <div>
                          <p className="text-sm font-medium text-[#2d2a35]">{m.title}</p>
                          <p className="text-[11px] text-[#c4b8d9]">{new Date(m.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                          {m.description && <p className="text-xs text-[#7c6f9b] mt-1 leading-relaxed">{m.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* places */}
            {publicPlaces.length > 0 && (
              <>
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                  <span className="text-xs" style={{ color: `rgba(${accentRgb}, 0.6)` }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                </div>
                <div className="mb-8">
                  <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: accent }}>places</p>
                  {[
                    { key: 'lived',   label: "lived",   emoji: '🏠' },
                    { key: 'visited', label: "visited", emoji: '✈️' },
                    { key: 'want',    label: "want to go", emoji: '🌍' },
                  ].map(({ key, label, emoji }) => {
                    const section = publicPlaces.filter(p => p.type === key)
                    if (!section.length) return null
                    return (
                      <div key={key} className="mb-4">
                        <p className="text-[11px] text-[#a89bc2] mb-2">{emoji} {label}</p>
                        <div className="flex flex-wrap gap-2">
                          {section.map(p => (
                            <span key={p.id} className="text-xs px-3 py-1.5 bg-white border rounded-full text-[#5a5065]" style={{ borderColor: `rgba(${accentRgb}, 0.2)` }}>
                              {p.emoji || '📍'} {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* season history */}
            {allSeasons.length > 1 && (
              <>
                <div className="flex items-center gap-3 my-8">
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                  <span className="text-xs" style={{ color: `rgba(${accentRgb}, 0.6)` }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.2)` }} />
                </div>
                <div className="mb-8">
                  <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: accent }}>seasons</p>
                  <div className="space-y-2 stagger-children">
                    {allSeasons.map(s => (
                      <div key={s.id} className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-3" style={{ borderColor: `rgba(${accentRgb}, 0.15)` }}>
                        <span className="text-lg shrink-0">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2d2a35]">{s.name}</p>
                          {s.startedAt && (
                            <p className="text-[11px] text-[#c4b8d9]">
                              {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              {s.endedAt && ` → ${new Date(s.endedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                            </p>
                          )}
                        </div>
                        {!s.endedAt && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${s.color}22`, color: s.color }}>current</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* footer */}
        <p className="text-center text-xs mt-14" style={{ color: `rgba(${accentRgb}, 0.4)` }}>
          ✦ the save point
        </p>
      </div>

      {showSeasonModal && (
        <SeasonModal
          season={season}
          onClose={() => setShowSeasonModal(false)}
          onSave={(updated) => {
            setSeason(updated)
            setShowSeasonModal(false)
          }}
        />
      )}
    </div>
  )
}
