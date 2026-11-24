// Everything you can reach from the menu, grouped into "rooms" so the menu opens calm:
// a handful of room names, not twenty-odd links. Add a page here when you add a route.

export const NAV_SECTIONS = [
  {
    label: 'daily',
    items: [
      { to: '/journal', label: 'journal' },
      { to: '/now', label: 'now' },
      { to: '/week', label: 'week' },
      { to: '/habits', label: 'habits' },
    ],
  },
  {
    label: 'time',
    items: [
      { to: '/seasons', label: 'seasons' },
      { to: '/month', label: 'month' },
      { to: '/year', label: 'year' },
      { to: '/traditions', label: 'traditions' },
    ],
  },
  {
    label: 'memories',
    items: [
      { to: '/milestones', label: 'milestones' },
      { to: '/letters', label: 'letters' },
      { to: '/capsule', label: 'time capsule' },
      { to: '/photos', label: 'photos' },
      { to: '/blog', label: 'blog' },
    ],
  },
  {
    label: 'collections',
    items: [
      { to: '/commonplace', label: 'commonplace' },
      { to: '/places', label: 'places' },
      { to: '/wishlist', label: 'wishlist' },
      { to: '/meals', label: 'meals' },
      { to: '/recipes', label: 'recipes' },
      { to: '/media', label: 'media log' },
    ],
  },
  {
    // other people's things — kept out of the daily path on purpose
    label: 'community',
    items: [
      { to: '/feed', label: 'feed' },
      { to: '/discover', label: 'discover' },
      { to: '/bookmarks', label: 'bookmarks' },
    ],
  },
  {
    label: 'you',
    items: [
      { to: '/settings', label: 'settings' },
    ],
  },
]

export const NAV_PATHS = NAV_SECTIONS.flatMap(s => s.items.map(i => i.to))

export function labelFor(path) {
  for (const s of NAV_SECTIONS) for (const i of s.items) if (i.to === path) return i.label
  return null
}

export function roomFor(path) {
  return NAV_SECTIONS.find(s => s.items.some(i => i.to === path))?.label ?? null
}
