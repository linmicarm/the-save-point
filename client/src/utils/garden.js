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

// 0..4 — which drawing a plant gets in the garden scene
export function stageIndex(actionCount) {
  return STAGES.indexOf(stageFor(actionCount))
}

// Sky colours for the garden scene. Weather only ever changes the sky — never the plants.
const SKIES = {
  sunny:  { top: '#f6c177', bottom: '#fbe3b4' },
  cloudy: { top: '#9aa5b1', bottom: '#cfd6dc' },
  rainy:  { top: '#667789', bottom: '#98a8b6' },
  stormy: { top: '#3d4458', bottom: '#6b6f87' },
}
const DEFAULT_SKY = { top: '#b9a8d9', bottom: '#eadfe9' }   // soft dusk when there's no check-in yet

export function skyFor(weather) {
  return SKIES[weather] ?? DEFAULT_SKY
}

// Evenly spaced x positions for `count` plants across a scene `width` units wide.
export function plantPositions(count, width = 320) {
  return Array.from({ length: count }, (_, i) => Math.round(((i + 1) * width) / (count + 1)))
}
