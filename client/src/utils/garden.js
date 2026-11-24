// The garden only grows. Stage comes from how many times a seed has been tended,
// and a replanted seed keeps its stage forever — nothing here ever shrinks or wilts.

export const STAGES = [
  { min: 0,  emoji: '🌰', name: 'seed' },
  { min: 1,  emoji: '🌱', name: 'sprout' },
  { min: 3,  emoji: '🌿', name: 'leafy' },
  { min: 6,  emoji: '🪴', name: 'growing' },
  { min: 10, emoji: '🌸', name: 'blooming' },
]

export function stageFor(actionCount) {
  const n = Number.isFinite(actionCount) ? Math.max(0, actionCount) : 0
  let stage = STAGES[0]
  for (const s of STAGES) if (n >= s.min) stage = s
  return stage
}

export function isActive(seed) {
  return !seed.replantedAt
}

// Has this seed been tended on the same local day as `now`?
export function tendedToday(seed, now = new Date()) {
  if (!seed.lastTendedAt) return false
  const d = new Date(seed.lastTendedAt)
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}
