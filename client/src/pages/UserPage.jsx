import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeasonModal from '../components/SeasonModal'
import CurrentlyShelf from '../components/CurrentlyShelf'
import SectionHeader from '../components/SectionHeader'
import UpdatesFeed from '../components/UpdatesFeed'
import { uploadImage } from '../utils/uploadImage'
import { useToast } from '../contexts/ToastContext'
import { hexToRgb, daysAgo, lastTended, fmtDate } from '../utils/format'
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBLE } from '../utils/sections'
import Button from '../components/Button'

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: 'lavender', value: '#c4b5fd' },
  { label: 'rose',     value: '#fda4af' },
  { label: 'sage',     value: '#86efac' },
  { label: 'peach',    value: '#fdba74' },
  { label: 'sky',      value: '#93c5fd' },
  { label: 'wheat',    value: '#d4b896' },
]

const CURRENTLY_FIELDS = [
  { key: 'currentlyWatching',  label: 'watching',  emoji: '📺', hasSearch: true  },
  { key: 'currentlyReading',   label: 'reading',   emoji: '📖', hasSearch: true  },
  { key: 'currentlyPlaying',   label: 'playing',   emoji: '🎮', hasSearch: true  },
  { key: 'currentlyListening', label: 'listening', emoji: '🎧', hasSearch: true  },
  { key: 'currentlyEating',    label: 'eating',    emoji: '🍜', hasSearch: false },
  { key: 'currentlyDrinking',  label: 'drinking',  emoji: '🍷', hasSearch: false },
  { key: 'currentlyMaking',    label: 'making',    emoji: '🎨', hasSearch: false },
]

const MOOD_VALUES = {
  '🤩': 10, '😄': 9, '😁': 9, '🥰': 9, '🥳': 9,
  '😊': 8,  '😎': 8, '✨': 8, '🌟': 8, '🌈': 8,
  '🌸': 7,  '😌': 7, '🍵': 7, '🌿': 7, '📚': 7,
  '🎵': 7,  '💫': 7, '🌙': 6, '💭': 5, '😐': 5,
  '🤔': 5,  '☁️': 5, '😑': 4, '😶': 4, '🤯': 4,
  '😩': 3,  '😫': 3, '😤': 3, '😔': 3, '⛈️': 2,
  '😢': 2,  '😞': 2, '😰': 2, '😠': 2, '😭': 1,
}

const MEDIA_TYPE_EMOJI = {
  book: '📖', movie: '🎬', show: '📺', music: '🎵', game: '🎮',
}

const STATUS_LABEL = {
  want: 'want', in_progress: 'reading', done: 'done',
}

const TAB_GROUPS = [
  { group: 'present', tabs: [
    { to: '/now',     label: 'now' },
    { to: '/feed',    label: 'feed' },
    { to: '/journal', label: 'journal' },
    { to: '/week',    label: 'week' },
    { to: '/habits',  label: 'habits' },
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
    { to: '/photos',      label: 'photos' },
    { to: '/blog',        label: 'blog' },
  ]},
  { group: 'collect', tabs: [
    { to: '/commonplace', label: 'commonplace' },
    { to: '/places',      label: 'places' },
    { to: '/wishlist',    label: 'wishlist' },
    { to: '/meals',       label: 'meals' },
    { to: '/recipes',     label: 'recipes' },
    { to: '/media',       label: 'media log' },
    { to: '/bookmarks',   label: 'bookmarks' },
  ]},
]

// ─────────────────────────────────────────────
//  Sparkline
// ─────────────────────────────────────────────

function MoodSparkline({ points, color }) {
  if (!points || points.length < 3) return null
  const W = 300, H = 48, PAD = 6
  const vals = points.map(p => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const coords = vals.map((v, i) => {
    const x = PAD + (i / (vals.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2)
    return [x, y]
  })
  const d = coords.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x},${y}`
    const [px, py] = coords[i - 1]
    const cx = (px + x) / 2
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`
  }, '')
  const fillD = `${d} L${coords[coords.length - 1][0]},${H} L${coords[0][0]},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mood-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#mood-grad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]}
        r="3" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

// ─────────────────────────────────────────────
//  SideNav
// ─────────────────────────────────────────────

function SideNav({ accentRgb, accent, location, isOwn, onExport, onLogout }) {
  return (
    <nav className="mt-1">
      {TAB_GROUPS.map(({ group, tabs }) => (
        <div key={group} className="mb-5">
          {/* group label — Caveat handwriting, warm and subtle */}
          <p className="text-[11px] mb-1.5 px-2"
            style={{ fontFamily: 'var(--font-hand)', color: `rgba(${accentRgb}, 0.8)`, letterSpacing: '0.04em' }}>
            {group}
          </p>
          <div className="flex flex-col gap-0.5">
            {tabs.map(({ to, label }) => {
              const active = location.pathname === to
              return (
                <Link key={to} to={to}
                  className="flex items-center gap-2.5 text-[13px] px-3 py-1.5 rounded-xl transition-all"
                  style={active
                    ? { background: `rgba(${accentRgb}, 0.1)`, color: accent, fontWeight: 500 }
                    : { color: 'var(--sp-text-muted)' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = `rgba(${accentRgb}, 0.06)`; e.currentTarget.style.color = 'var(--sp-text)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sp-text-muted)' } }}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />}
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
      {isOwn && (
        <div className="mt-2 pt-3 border-t flex flex-col gap-0.5"
          style={{ borderColor: 'var(--sp-border)' }}>
          {[
            { to: '/discover', label: '✦ discover' },
            { to: '/settings', label: 'settings' },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-2.5 text-[13px] px-3 py-1.5 rounded-xl transition-all"
              style={{ color: 'var(--sp-text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${accentRgb}, 0.06)`; e.currentTarget.style.color = accent }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sp-text-muted)' }}
            >{label}</Link>
          ))}
          {[
            { fn: onExport, label: 'export data' },
            { fn: onLogout, label: 'sign out' },
          ].map(({ fn, label }) => (
            <button key={label} onClick={fn}
              className="flex items-center gap-2.5 text-[13px] px-3 py-1.5 rounded-xl transition-all text-left w-full"
              style={{ color: 'var(--sp-text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${accentRgb}, 0.06)`; e.currentTarget.style.color = accent }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sp-text-muted)' }}
            >{label}</button>
          ))}
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────
//  Page Header
// ─────────────────────────────────────────────

function PageHeader({ profile, season, accent, accentRgb, isOwn, authUser,
  following, followLoading, onEdit, onFollow, onSeasonClick }) {
  const seasonDays = season ? daysAgo(season.startedAt) : 0
  return (
    <div className="w-full relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, rgba(${accentRgb}, 0.1) 0%, rgba(${accentRgb}, 0.05) 100%)` }}>
      {profile.headerUrl && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `url(${profile.headerUrl})`, backgroundSize: 'cover',
            backgroundPosition: 'center', opacity: 0.18 }} />
      )}
      {/* decorative soft vignette at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, rgba(${accentRgb}, 0.06))` }} />
      <div className="relative max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar — slightly larger with a warm ring */}
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg overflow-hidden shrink-0"
            style={{ background: profile.avatarUrl ? 'transparent' : `rgba(${accentRgb}, 0.8)`,
              boxShadow: `0 0 0 3px white, 0 0 0 5px rgba(${accentRgb}, 0.3), 0 8px 24px rgba(${accentRgb}, 0.2)` }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
              : <span style={{ fontFamily: 'var(--font-display)' }}>{profile.displayName?.[0]?.toUpperCase() || '✦'}</span>
            }
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h1 className="text-3xl sm:text-4xl leading-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: `rgba(${accentRgb}, 0.95)`, letterSpacing: '-0.02em' }}>
                {profile.displayName}
              </h1>
              {profile.pronouns && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full border shrink-0"
                  style={{ color: `rgba(${accentRgb}, 0.7)`, borderColor: `rgba(${accentRgb}, 0.25)` }}>
                  {profile.pronouns}
                </span>
              )}
            </div>
            {profile.location && (
              <p className="text-[13px] mb-2" style={{ color: `rgba(${accentRgb}, 0.6)` }}>
                📍 {profile.location}
              </p>
            )}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              {season ? (
                <>
                  <button onClick={isOwn ? onSeasonClick : undefined}
                    className="inline-flex items-center gap-1.5 text-sm rounded-full px-3.5 py-1.5 font-medium transition-opacity"
                    style={{ background: `${season.color}20`, color: season.color,
                      border: `1.5px solid ${season.color}40` }}
                    onMouseEnter={e => { if (isOwn) e.currentTarget.style.opacity = '0.75' }}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <span>{season.emoji}</span>
                    <span>{season.name}</span>
                  </button>
                  <span className="text-[11px]" style={{ color: `rgba(${accentRgb}, 0.5)` }}>
                    · {seasonDays === 0 ? 'started today' : `${seasonDays} day${seasonDays === 1 ? '' : 's'} in`}
                  </span>
                </>
              ) : isOwn ? (
                <Button variant="primary" onClick={onSeasonClick}>✦ start a season</Button>
              ) : null}
            </div>
            {profile.bio && (
              <p className="text-[14px] leading-relaxed max-w-xl" style={{ color: `rgba(${accentRgb}, 0.75)` }}>
                {profile.bio}
              </p>
            )}
            {!profile.bio && isOwn && (
              <p className="text-xs italic" style={{ color: `rgba(${accentRgb}, 0.35)` }}>
                add a bio to tell your story...
              </p>
            )}
            {profile.pinnedQuote && (
              <p className="text-[12px] italic mt-2 leading-relaxed"
                style={{ color: `rgba(${accentRgb}, 0.8)`,
                  borderLeft: `2px solid rgba(${accentRgb}, 0.2)`, paddingLeft: '10px' }}>
                "{profile.pinnedQuote}"
              </p>
            )}
          </div>
          {/* Edit / Follow */}
          <div className="shrink-0 flex flex-col items-end gap-2 sm:pt-1">
            {isOwn ? (
              <Button variant="secondary" size="sm" onClick={onEdit}>edit profile</Button>
            ) : authUser && (
              <button disabled={followLoading} onClick={onFollow}
                className="text-xs px-4 py-2 rounded-full border font-medium transition-all disabled:opacity-50"
                style={following
                  ? { borderColor: `rgba(${accentRgb}, 0.3)`, color: accent }
                  : { borderColor: accent, background: accent, color: 'white' }}>
                {followLoading ? '…' : following ? 'following' : '+ follow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Registry section components
//  (defined at module level so they're stable refs;
//   receive their data as props from the registry closures)
// ─────────────────────────────────────────────

function CurrentlySection({ profile, isOwn, accent, accentRgb, onAdd, onRemove }) {
  const hasAny = CURRENTLY_FIELDS.some(f => (profile[f.key] || []).length > 0)
  if (!hasAny && !isOwn) return null
  return (
    <section className="mb-10">
      <SectionHeader label="currently" accent={accent} accentRgb={accentRgb} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CURRENTLY_FIELDS.map(f => {
          const items = profile[f.key] || []
          if (!items.length && !isOwn) return null
          return (
            <div key={f.key} className="rounded-2xl p-4"
              style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
                boxShadow: `0 1px 4px rgba(${accentRgb}, 0.06), 0 0 0 0.5px rgba(${accentRgb}, 0.08)` }}>
              <CurrentlyShelf fieldDef={f} items={items} isOwn={isOwn}
                accent={accent} accentRgb={accentRgb}
                onAdd={item => onAdd(f.key, item)}
                onRemove={i => onRemove(f.key, i)} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function JournalPreviews({ entries, accent, accentRgb, isOwn }) {
  if (!entries.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label="recent journal" accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/journal' : null} />
      <div className="grid gap-3 sm:grid-cols-3">
        {entries.slice(0, 3).map(entry => (
          <div key={entry.id} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)',
              boxShadow: `0 1px 6px rgba(${accentRgb}, 0.06)` }}>
            {entry.mood && <span className="text-xl leading-none">{entry.mood}</span>}
            <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--sp-text-muted)' }}>
              {entry.body.slice(0, 120)}{entry.body.length > 120 && '…'}
            </p>
            <div className="flex items-center justify-between mt-auto pt-1 gap-2 flex-wrap">
              {entry.season
                ? <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `${entry.season.color}18`, color: entry.season.color }}>
                    {entry.season.emoji} {entry.season.name}
                  </span>
                : <span />}
              <span className="text-[10px]" style={{ color: `rgba(${accentRgb}, 0.4)` }}>
                {fmtDate(entry.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MoodArc({ entries, season, accent, accentRgb }) {
  if (!season || !entries.length) return null
  const seasonStart = new Date(season.startedAt).getTime()
  const moodPoints = entries
    .filter(e => e.mood && MOOD_VALUES[e.mood] !== undefined && new Date(e.createdAt).getTime() >= seasonStart)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(e => ({ value: MOOD_VALUES[e.mood], date: e.createdAt }))
  if (moodPoints.length < 3) return null
  const avg = moodPoints.reduce((s, p) => s + p.value, 0) / moodPoints.length
  const avgLabel = avg >= 8 ? 'bright' : avg >= 6 ? 'steady' : avg >= 4 ? 'mixed' : 'heavy'
  return (
    <section className="mb-10">
      <SectionHeader label="emotional arc this season" accent={accent} accentRgb={accentRgb} />
      <div className="rounded-2xl px-5 pt-5 pb-4"
        style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)`,
          boxShadow: `0 1px 6px rgba(${accentRgb}, 0.06)` }}>
        <MoodSparkline points={moodPoints} color={accent} />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px]" style={{ color: `rgba(${accentRgb}, 0.5)` }}>
            {moodPoints.length} moments logged
          </p>
          <p className="text-[11px]" style={{ color: accent }}>mostly {avgLabel} this season</p>
        </div>
      </div>
    </section>
  )
}

function SeasonMediaShelf({ items, season, accent, accentRgb, isOwn }) {
  if (!items.length || !season) return null
  const seasonItems = items.filter(m => m.seasonId === season.id || m.season?.id === season.id)
  if (!seasonItems.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label={`${season.emoji} shelf this season`} accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/media' : null} />
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {seasonItems.map(item => (
          <div key={item.id} className="shrink-0 w-28 rounded-xl overflow-hidden"
            style={{ border: `1px solid rgba(${accentRgb}, 0.12)`, background: 'rgba(255,255,255,0.7)',
              boxShadow: `0 1px 6px rgba(${accentRgb}, 0.06)` }}>
            {item.coverUrl
              ? <img src={item.coverUrl} alt={item.title} className="w-full h-36 object-cover" />
              : <div className="w-full h-36 flex items-center justify-center text-3xl"
                  style={{ background: `rgba(${accentRgb}, 0.08)` }}>
                  {MEDIA_TYPE_EMOJI[item.type] || '✦'}
                </div>
            }
            <div className="px-2.5 py-2">
              <p className="text-[11px] font-medium leading-tight line-clamp-2" style={{ color: 'var(--sp-text)' }}>
                {item.title}
              </p>
              <span className="inline-block text-[9px] mt-1 px-1.5 py-0.5 rounded-full"
                style={{ background: `rgba(${accentRgb}, 0.1)`, color: accent }}>
                {STATUS_LABEL[item.status] || item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function NowSection({ nowEntry, accent, accentRgb, isOwn, username }) {
  if (!nowEntry) return null
  return (
    <section className="mb-10">
      <SectionHeader label="now" accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/now' : `/u/${username}/now`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {[
          { key: 'focus',    label: 'focused on' },
          { key: 'building', label: 'building' },
          { key: 'learning', label: 'learning' },
          { key: 'feeling',  label: 'feeling' },
        ].filter(f => nowEntry[f.key]).map(({ key, label }) => (
          <div key={key} className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)`,
              boxShadow: `0 1px 6px rgba(${accentRgb}, 0.05)` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
              {label}
            </p>
            <p className="text-sm text-[#5a5065] leading-relaxed">{nowEntry[key]}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function OnThisDaySection({ onThisDay, accent, accentRgb }) {
  if (!onThisDay.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label="on this day" accent={accent} accentRgb={accentRgb} />
      <div className="space-y-2">
        {onThisDay.map(m => {
          const yearsAgo = new Date().getFullYear() - new Date(m.date).getFullYear()
          return (
            <div key={m.id} className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)` }}>
              <span className="text-xl shrink-0 mt-0.5">{m.emoji || '✦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2d2a35]">{m.title}</p>
                {m.description && (
                  <p className="text-xs text-[#7c6f9b] mt-0.5 leading-relaxed">{m.description}</p>
                )}
              </div>
              <span className="text-[10px] shrink-0 mt-0.5 font-medium" style={{ color: accent }}>
                {yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CommonplaceSection({ commonplaceEntry, accent, accentRgb, isOwn }) {
  if (!commonplaceEntry) return null
  return (
    <section className="mb-10">
      <SectionHeader label="from the commonplace book" accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/commonplace' : null} />
      <blockquote className="relative rounded-2xl px-6 py-5"
        style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)`,
          boxShadow: `0 1px 6px rgba(${accentRgb}, 0.05)` }}>
        <span className="absolute top-3 left-4 text-3xl leading-none select-none"
          style={{ color: `rgba(${accentRgb}, 0.15)`, fontFamily: 'var(--font-serif)' }}>"</span>
        <p className="text-sm text-[#5a5065] leading-relaxed italic relative z-10 pt-2">
          {commonplaceEntry.body}
        </p>
        {commonplaceEntry.source && (
          <p className="text-[11px] mt-2.5" style={{ color: `rgba(${accentRgb}, 0.6)` }}>
            — {commonplaceEntry.source}
          </p>
        )}
      </blockquote>
    </section>
  )
}

function BlogSection({ publicBlogPosts, accent, accentRgb, username }) {
  if (!publicBlogPosts.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label="blog" accent={accent} accentRgb={accentRgb}
        linkTo={`/u/${username}/blog`} />
      <div className="space-y-3">
        {publicBlogPosts.slice(0, 3).map(post => {
          const coverImg = post.coverUrl || post.content?.find?.(b => b.type === 'image' && b.url)?.url
          return (
            <Link key={post.id} to={`/u/${username}/blog/${post.slug}`}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 group transition-all"
              style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.35)`}
              onMouseLeave={e => e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.12)`}>
              {coverImg && <img src={coverImg} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2d2a35] truncate"
                  style={{ fontFamily: 'var(--font-serif)' }}>{post.title}</p>
                <p className="text-[10px] text-[#c4b8d9] mt-0.5">
                  {fmtDate(post.createdAt)}{post.mood && ` · ${post.mood}`}
                </p>
              </div>
              <span className="text-[#c4b8d9] group-hover:text-[#a89bc2] transition-colors text-sm shrink-0">→</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function UpdatesSection({ username, isOwn, accent, accentRgb }) {
  return <UpdatesFeed username={username} isOwn={isOwn} accent={accent} accentRgb={accentRgb} />
}

function MilestonesSection({ publicMilestones, accent, accentRgb, isOwn }) {
  if (!publicMilestones.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label="milestones" accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/milestones' : null} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {publicMilestones.slice(0, 6).map(m => (
          <div key={m.id} className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid rgba(${accentRgb}, 0.12)` }}>
            <span className="text-xl shrink-0 mt-0.5">{m.emoji || '✦'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#2d2a35] truncate">{m.title}</p>
              <p className="text-[11px] text-[#c4b8d9]">
                {new Date(m.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              {m.description && (
                <p className="text-xs text-[#7c6f9b] mt-1 leading-relaxed line-clamp-2">{m.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlacesSection({ publicPlaces, accent, accentRgb, isOwn }) {
  if (!publicPlaces.length) return null
  return (
    <section className="mb-10">
      <SectionHeader label="places" accent={accent} accentRgb={accentRgb}
        linkTo={isOwn ? '/places' : null} />
      <div className="space-y-4">
        {[
          { key: 'lived',   label: 'lived',     emoji: '🏠' },
          { key: 'visited', label: 'visited',    emoji: '✈️' },
          { key: 'want',    label: 'want to go', emoji: '🌍' },
        ].map(({ key, label, emoji }) => {
          const section = publicPlaces.filter(p => p.type === key)
          if (!section.length) return null
          return (
            <div key={key}>
              <p className="text-[11px] mb-2 flex items-center gap-1.5"
                style={{ color: `rgba(${accentRgb}, 0.6)` }}>{emoji} {label}</p>
              <div className="flex flex-wrap gap-2">
                {section.map(p => (
                  <span key={p.id} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.7)',
                      border: `1px solid rgba(${accentRgb}, 0.15)`, color: 'var(--sp-text-muted)' }}>
                    {p.emoji || '📍'} {p.name}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AboutSection({ profile, accentRgb }) {
  const hasAny = profile.website || profile.birthday || profile.createdAt
  if (!hasAny) return null
  return (
    <section className="mt-10 pt-8" style={{ borderTop: `1px solid rgba(${accentRgb}, 0.1)` }}>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]"
        style={{ color: `rgba(${accentRgb}, 0.8)` }}>
        {profile.website && (
          <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-75">
            🔗 {profile.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
          </a>
        )}
        {profile.birthday && <span className="flex items-center gap-1.5">🎂 {profile.birthday}</span>}
        {profile.createdAt && (
          <span className="flex items-center gap-1.5">
            📅 member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        )}
        {profile.updatedAt && (
          <span className="flex items-center gap-1.5" style={{ opacity: 0.6 }}>
            ✦ last tended {lastTended(profile.updatedAt)}
          </span>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function UserPage() {
  const { username } = useParams()
  const { user: authUser, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [draft, setDraft]         = useState({})
  const [season, setSeason]       = useState(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [profileCounts, setProfileCounts]     = useState(null)
  const [pageSettings, setPageSettings]       = useState(null)

  const [nowEntry, setNowEntry]                 = useState(null)
  const [publicMilestones, setPublicMilestones] = useState([])
  const [publicPlaces, setPublicPlaces]         = useState([])
  const [onThisDay, setOnThisDay]               = useState([])
  const [commonplaceEntry, setCommonplaceEntry] = useState(null)
  const [publicBlogPosts, setPublicBlogPosts]   = useState([])
  const [following, setFollowing]               = useState(false)
  const [followCounts, setFollowCounts]         = useState({ followersCount: 0, followingCount: 0 })
  const [followLoading, setFollowLoading]       = useState(false)
  const [publicJournal, setPublicJournal]       = useState([])
  const [publicMedia, setPublicMedia]           = useState([])

  const isOwn = authUser?.username === username

  useEffect(() => {
    Promise.all([
      axios.get(`/api/users/${username}`),
      axios.get(`/api/seasons/user/${username}`),
    ])
      .then(([userRes, seasonRes]) => {
        setProfile(userRes.data.user)
        setProfileCounts(userRes.data.counts || null)
        setPageSettings(userRes.data.pageSettings || null)
        setSeason(seasonRes.data.season)
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    axios.get(`/api/now/public/${username}`).then(r => setNowEntry(r.data.entry)).catch(() => {})
    axios.get(`/api/milestones/public/${username}`).then(r => setPublicMilestones(r.data.milestones)).catch(() => {})
    axios.get(`/api/milestones/onthisday/${username}`).then(r => setOnThisDay(r.data.milestones || [])).catch(() => {})
    axios.get(`/api/places/public/${username}`).then(r => setPublicPlaces(r.data.places)).catch(() => {})
    axios.get(`/api/commonplace/public/${username}`).then(r => setCommonplaceEntry(r.data.entry)).catch(() => {})
    axios.get(`/api/blog/user/${username}`).then(r => setPublicBlogPosts(r.data.posts || [])).catch(() => {})
    axios.get(`/api/follows/status/${username}`).then(r => {
      setFollowing(r.data.following)
      setFollowCounts({ followersCount: r.data.followersCount, followingCount: r.data.followingCount })
    }).catch(() => {})
    axios.get(`/api/journal/public/${username}`).then(r => setPublicJournal(r.data.entries || [])).catch(() => {})
    axios.get(`/api/medialog/public/${username}`).then(r => setPublicMedia(r.data.mediaLogs || [])).catch(() => {})
  }, [username])

  useEffect(() => {
    if (!editing) return
    const onKey = e => { if (e.key === 'Escape') setEditing(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  const startEditing = () => {
    setDraft({
      displayName: profile.displayName, bio: profile.bio || '',
      pinnedQuote: profile.pinnedQuote || '', pronouns: profile.pronouns || '',
      location: profile.location || '', website: profile.website || '',
      birthday: profile.birthday || '', headerUrl: profile.headerUrl || '',
      avatarUrl: profile.avatarUrl || '', accentColor: profile.accentColor,
      isDiscoverable: profile.isDiscoverable || false,
    })
    setEditing(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      const res = await axios.patch('/api/users/me', draft)
      setProfile(res.data.user)
      setEditing(false)
    } catch { showToast('could not save changes — try again') }
    finally { setSaving(false) }
  }

  const saveCurrently = async (key, items) => {
    try {
      const res = await axios.patch('/api/users/me', { [key]: items })
      setProfile(p => ({ ...p, [key]: res.data.user[key] }))
    } catch { showToast('could not save — try again') }
  }

  const addCurrentlyItem    = (key, item) => saveCurrently(key, [...(profile[key] || []), item])
  const removeCurrentlyItem = (key, i)    => saveCurrently(key, (profile[key] || []).filter((_, j) => j !== i))

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'savepoint-export.json'; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Export failed', 'error') }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      if (following) {
        await axios.delete(`/api/follows/${username}`)
        setFollowing(false)
        setFollowCounts(c => ({ ...c, followersCount: c.followersCount - 1 }))
      } else {
        await axios.post(`/api/follows/${username}`)
        setFollowing(true)
        setFollowCounts(c => ({ ...c, followersCount: c.followersCount + 1 }))
      }
    } catch { /* follow/unfollow request failed — ignore, UI already rolled back */ }
    setFollowLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sp-bg)' }}>
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sp-bg)' }}>
      <div className="text-center">
        <p className="text-3xl mb-3">✦</p>
        <p className="text-sm text-[#a89bc2]">this save point doesn't exist yet</p>
      </div>
    </div>
  )

  const accent    = editing ? draft.accentColor : profile.accentColor
  const accentRgb = hexToRgb(accent)
  const a = { accent, accentRgb }  // shorthand for shared accent props

  const hasUnsaved = editing && JSON.stringify({
    displayName: draft.displayName, bio: draft.bio, pinnedQuote: draft.pinnedQuote,
    pronouns: draft.pronouns, location: draft.location,
    website: draft.website, birthday: draft.birthday,
    headerUrl: draft.headerUrl, avatarUrl: draft.avatarUrl,
    accentColor: draft.accentColor, isDiscoverable: draft.isDiscoverable,
  }) !== JSON.stringify({
    displayName: profile.displayName, bio: profile.bio || '', pinnedQuote: profile.pinnedQuote || '',
    pronouns: profile.pronouns || '', location: profile.location || '',
    website: profile.website || '', birthday: profile.birthday || '',
    headerUrl: profile.headerUrl || '', avatarUrl: profile.avatarUrl || '',
    accentColor: profile.accentColor, isDiscoverable: profile.isDiscoverable || false,
  })

  // ── Section registry ──────────────────────────────────────────
  // Each key maps to a render function that closes over current state.
  const sectionRegistry = {
    currently: () => <CurrentlySection key="currently" profile={profile} isOwn={isOwn} {...a}
                       onAdd={addCurrentlyItem} onRemove={removeCurrentlyItem} />,
    journal:   () => <JournalPreviews  key="journal"   entries={publicJournal} username={username} isOwn={isOwn} {...a} />,
    mood:      () => <MoodArc          key="mood"      entries={publicJournal} season={season} {...a} />,
    shelf:     () => <SeasonMediaShelf key="shelf"     items={publicMedia} season={season} isOwn={isOwn} {...a} />,
    now:       () => <NowSection       key="now"       nowEntry={nowEntry} username={username} isOwn={isOwn} {...a} />,
    onthisday: () => <OnThisDaySection key="onthisday" onThisDay={onThisDay} {...a} />,
    commonplace:() => <CommonplaceSection key="commonplace" commonplaceEntry={commonplaceEntry} isOwn={isOwn} {...a} />,
    blog:      () => <BlogSection      key="blog"      publicBlogPosts={publicBlogPosts} username={username} {...a} />,
    updates:   () => <UpdatesSection   key="updates"   username={username} isOwn={isOwn} {...a} />,
    milestones:() => <MilestonesSection key="milestones" publicMilestones={publicMilestones} isOwn={isOwn} {...a} />,
    places:    () => <PlacesSection    key="places"    publicPlaces={publicPlaces} isOwn={isOwn} {...a} />,
  }

  const sectionsOrder   = pageSettings?.sectionsOrder   ?? DEFAULT_SECTION_ORDER
  const sectionsVisible = pageSettings?.sectionsVisible ?? DEFAULT_SECTION_VISIBLE

  return (
    <div className="min-h-screen" style={{ background: 'var(--sp-bg)' }}>

      <PageHeader
        profile={profile} season={season} accent={accent} accentRgb={accentRgb}
        isOwn={isOwn} authUser={authUser}
        following={following} followLoading={followLoading}
        onEdit={startEditing} onFollow={handleFollow}
        onSeasonClick={() => setShowSeasonModal(true)}
      />

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">

          {/* ── LEFT: slim sticky nav ── */}
          <aside className="w-full lg:w-48 xl:w-56 shrink-0 lg:sticky lg:top-8">
            {(followCounts.followersCount > 0 || followCounts.followingCount > 0) && (
              <div className="flex gap-4 mb-4 text-[11px]">
                <span style={{ color: `rgba(${accentRgb}, 0.7)` }}>
                  <span className="font-semibold" style={{ color: accent }}>{followCounts.followersCount}</span> followers
                </span>
                <span style={{ color: `rgba(${accentRgb}, 0.7)` }}>
                  <span className="font-semibold" style={{ color: accent }}>{followCounts.followingCount}</span> following
                </span>
              </div>
            )}
            {profileCounts && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {profileCounts.seasons > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full"
                    style={{ background: `rgba(${accentRgb}, 0.08)`, color: `rgba(${accentRgb}, 0.7)` }}>
                    {profileCounts.seasons} seasons
                  </span>
                )}
                {profileCounts.milestones > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full"
                    style={{ background: `rgba(${accentRgb}, 0.08)`, color: `rgba(${accentRgb}, 0.7)` }}>
                    {profileCounts.milestones} milestones
                  </span>
                )}
                {profileCounts.posts > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full"
                    style={{ background: `rgba(${accentRgb}, 0.08)`, color: `rgba(${accentRgb}, 0.7)` }}>
                    {profileCounts.posts} updates
                  </span>
                )}
              </div>
            )}
            {isOwn && (
              <SideNav accentRgb={accentRgb} accent={accent} location={location}
                isOwn={isOwn} onExport={handleExport} onLogout={handleLogout} />
            )}
          </aside>

          {/* ── MAIN: settings-driven section rendering ── */}
          <main className="flex-1 min-w-0">
            {sectionsOrder
              .filter(key => sectionsVisible[key] !== false && sectionRegistry[key])
              .map(key => sectionRegistry[key]())
            }
            <AboutSection profile={profile} accentRgb={accentRgb} />
            <p className="text-center text-xs mt-12" style={{ color: `rgba(${accentRgb}, 0.3)` }}>
              ✦ the save point
            </p>
          </main>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
          style={{ background: 'rgba(30,25,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setEditing(false)}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4dff0] shrink-0">
              <button onClick={() => setEditing(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a89bc2] hover:bg-[#f5f0ff] hover:text-[#5a5065] transition-colors text-sm">✕</button>
              <p className="text-sm font-medium text-[#2d2a35]">Edit profile</p>
              <button onClick={saveEdits} disabled={saving}
                className="text-xs px-4 py-1.5 rounded-full text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: accent }}>
                {hasUnsaved && !saving && <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                {saving ? 'saving…' : 'save'}
              </button>
            </div>
            {/* Banner */}
            <div className="relative h-36 cursor-pointer overflow-hidden"
              style={draft.headerUrl
                ? { backgroundImage: `url(${draft.headerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: `linear-gradient(135deg, rgba(${accentRgb},0.25), rgba(${accentRgb},0.07))` }}
              onClick={() => document.getElementById('modal-header-upload').click()}>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white text-base">📷</div>
                {draft.headerUrl && (
                  <button onClick={e => { e.stopPropagation(); setDraft(d => ({ ...d, headerUrl: '' })) }}
                    className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white text-sm hover:bg-black/60 transition-colors">✕</button>
                )}
              </div>
              <input id="modal-header-upload" type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const f = e.target.files[0]; if (!f) return
                  const url = await uploadImage(f, 'headers')
                  setDraft(d => ({ ...d, headerUrl: url }))
                }} />
            </div>
            {/* Avatar */}
            <div className="px-5 -mt-8 mb-2">
              <div className="relative w-16 h-16 cursor-pointer group"
                onClick={() => document.getElementById('modal-avatar-upload').click()}>
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-sm"
                  style={{ background: draft.avatarUrl ? 'transparent' : `rgba(${accentRgb}, 0.85)` }}>
                  {draft.avatarUrl
                    ? <img src={draft.avatarUrl} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-xl"
                        style={{ fontFamily: 'var(--font-serif)' }}>
                        {draft.displayName?.[0]?.toUpperCase() || '✦'}
                      </div>}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">📷</div>
                <input id="modal-avatar-upload" type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const f = e.target.files[0]; if (!f) return
                    const url = await uploadImage(f, 'avatars', 400)
                    setDraft(d => ({ ...d, avatarUrl: url }))
                  }} />
              </div>
              {draft.avatarUrl && (
                <button onClick={() => setDraft(d => ({ ...d, avatarUrl: '' }))}
                  className="text-[11px] text-[#c4b8d9] hover:text-rose-400 transition-colors mt-1 block">
                  remove photo
                </button>
              )}
            </div>
            <div className="px-5 pb-6 space-y-4 overflow-y-auto">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-[#a89bc2] mb-1.5">display name</p>
                  <input value={draft.displayName} onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] focus:outline-none focus:border-[#a89bc2]" />
                </div>
                <div className="w-32">
                  <p className="text-xs text-[#a89bc2] mb-1.5">pronouns</p>
                  <input value={draft.pronouns} onChange={e => setDraft(d => ({ ...d, pronouns: e.target.value }))}
                    placeholder="she/her"
                    className="w-full px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#a89bc2] mb-1.5">bio</p>
                <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                  placeholder="a little about this season of your life..." rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed" />
              </div>
              <div>
                <p className="text-xs text-[#a89bc2] mb-1.5">pinned quote or motto</p>
                <textarea value={draft.pinnedQuote} onChange={e => setDraft(d => ({ ...d, pinnedQuote: e.target.value }))}
                  placeholder="a line that feels like you right now..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed italic" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-[#a89bc2] mb-1.5">location</p>
                  <input value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                    placeholder="city, country"
                    className="w-full px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#a89bc2] mb-1.5">website</p>
                  <input value={draft.website} onChange={e => setDraft(d => ({ ...d, website: e.target.value }))}
                    placeholder="yoursite.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#a89bc2] mb-1.5">birthday <span className="text-[#d4cfe3]">(shown publicly)</span></p>
                <input value={draft.birthday} onChange={e => setDraft(d => ({ ...d, birthday: e.target.value }))}
                  placeholder="e.g. March 15"
                  className="w-52 px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]" />
              </div>
              <div>
                <p className="text-xs text-[#a89bc2] mb-2.5">accent color</p>
                <div className="flex gap-2.5">
                  {ACCENT_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setDraft(d => ({ ...d, accentColor: p.value }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: p.value,
                        outline: draft.accentColor === p.value ? `2px solid ${p.value}` : 'none',
                        outlineOffset: '3px' }}
                      title={p.label} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-[#2d2a35] font-medium">appear on discover</p>
                  <p className="text-[10px] text-[#c4b8d9] mt-0.5">let others find your profile</p>
                </div>
                <button onClick={() => setDraft(d => ({ ...d, isDiscoverable: !d.isDiscoverable }))}
                  className="text-[10px] px-3 py-1 rounded-full border transition-colors"
                  style={draft.isDiscoverable
                    ? { background: `rgba(${accentRgb},0.12)`, color: accent, borderColor: `rgba(${accentRgb},0.3)` }
                    : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}>
                  {draft.isDiscoverable ? '✦ on' : 'off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSeasonModal && (
        <SeasonModal
          season={season}
          onClose={() => setShowSeasonModal(false)}
          onSave={updated => { setSeason(updated); setShowSeasonModal(false) }}
        />
      )}
    </div>
  )
}
