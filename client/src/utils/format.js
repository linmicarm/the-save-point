/**
 * Pure formatting helpers shared across the app.
 * No DOM, no React — fully unit-testable.
 */

/** Convert a 6-digit hex colour to an "r, g, b" string for use in rgba(). */
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

/** How many whole days ago was `dateStr` (ISO string or anything Date() accepts)? */
export function daysAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

/** Human-readable relative time label ("just now", "3h ago", "2w ago", …). */
export function lastTended(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs  = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 5)   return 'just now'
  if (hrs  < 1)   return `${mins}m ago`
  if (hrs  < 24)  return `${hrs}h ago`
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/** Format an ISO date string as "Month D, YYYY". */
export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  })
}

/**
 * How long ago was `date`?
 * Used on post timestamps. Mirrors the logic in UpdatesFeed.jsx (exported there too).
 */
export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    ...(d > 365 && { year: 'numeric' }),
  })
}
