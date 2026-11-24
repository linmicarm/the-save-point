// Starting points for common life transitions. Client-only: picking one just
// pre-fills the SeasonModal form — the user can edit everything before saving.
// Colors come from the same presets SeasonModal already offers.

export const SEASON_TEMPLATES = [
  {
    key: 'new-city',
    label: 'new city',
    name: 'a new city',
    emoji: '🏙️',
    color: '#93c5fd',
    intention: 'find my corners, my people, and what feels like home here.',
  },
  {
    key: 'new-job',
    label: 'new job',
    name: 'a new chapter at work',
    emoji: '💼',
    color: '#fdba74',
    intention: 'learn the ropes without losing myself.',
  },
  {
    key: 'starting-over',
    label: 'starting over',
    name: 'starting over',
    emoji: '🌱',
    color: '#86efac',
    intention: 'build something new, slowly, on purpose.',
  },
  {
    key: 'healing',
    label: 'healing era',
    name: 'healing era',
    emoji: '🌙',
    color: '#c4b5fd',
    intention: 'be gentle with myself. rest is allowed.',
  },
]

// Returns the form fields a template should set (never touches coverUrl).
export function applyTemplate(template) {
  const { name, emoji, color, intention } = template
  return { name, emoji, color, intention }
}
