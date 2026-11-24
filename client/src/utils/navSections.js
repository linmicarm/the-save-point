// Everything you can reach from the menu, grouped the way the routes are grouped in App.jsx.
// Add a page here when you add a route, and the menu (desktop + mobile) picks it up.

export const NAV_SECTIONS = [
  {
    label: 'present',
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
    label: 'memory',
    items: [
      { to: '/milestones', label: 'milestones' },
      { to: '/letters', label: 'letters' },
      { to: '/capsule', label: 'time capsule' },
      { to: '/photos', label: 'photos' },
      { to: '/blog', label: 'blog' },
    ],
  },
  {
    label: 'collect',
    items: [
      { to: '/commonplace', label: 'commonplace' },
      { to: '/places', label: 'places' },
      { to: '/wishlist', label: 'wishlist' },
      { to: '/meals', label: 'meals' },
      { to: '/recipes', label: 'recipes' },
      { to: '/media', label: 'media log' },
      { to: '/bookmarks', label: 'bookmarks' },
    ],
  },
  {
    label: 'elsewhere',
    items: [
      { to: '/feed', label: 'feed' },
      { to: '/discover', label: 'discover' },
      { to: '/settings', label: 'settings' },
    ],
  },
]

export const NAV_PATHS = NAV_SECTIONS.flatMap(s => s.items.map(i => i.to))
