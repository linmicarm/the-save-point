// Section ordering and visibility defaults — shared between UserPage and SettingsPage.
// Kept in a plain utility module so both pages can import without violating
// the react-refresh rule (which requires component-only exports from .jsx files).

export const DEFAULT_SECTION_ORDER = [
  'currently', 'journal', 'mood', 'shelf',
  'places', 'milestones', 'now', 'onthisday',
  'commonplace', 'blog', 'updates',
]

export const DEFAULT_SECTION_VISIBLE = Object.fromEntries(
  DEFAULT_SECTION_ORDER.map(k => [k, true])
)
