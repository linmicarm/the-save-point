// Inner-weather check-in config + tiny rule-based suggestions (no AI, no scoring).
// Nothing here ranks or punishes — a stormy day just gets a gentler nudge.

export const WEATHER = [
  { key: 'sunny',  emoji: '☀️', label: 'sunny',  hint: 'plenty of energy' },
  { key: 'cloudy', emoji: '⛅', label: 'cloudy', hint: 'a bit foggy' },
  { key: 'rainy',  emoji: '🌧️', label: 'rainy',  hint: 'low and tender' },
  { key: 'stormy', emoji: '⛈️', label: 'stormy', hint: 'a lot right now' },
]

const SUGGESTIONS = {
  sunny:  'good day to move one small thing forward — or to simply enjoy the light.',
  cloudy: 'pick one tiny thing. everything else can wait until the sky clears.',
  rainy:  'rest counts as progress. maybe a warm drink and a few honest lines.',
  stormy: "you don't have to fix anything today. just get through it gently — write if it helps.",
}

const FALLBACK = 'whatever the weather is, you showed up. that counts.'

export function suggestionFor(weather) {
  return SUGGESTIONS[weather] ?? FALLBACK
}

export function weatherMeta(weather) {
  return WEATHER.find(w => w.key === weather) ?? null
}

// True if `iso` falls on the same local calendar day as `now`.
export function isSameLocalDay(iso, now = new Date()) {
  const a = new Date(iso)
  return (
    a.getFullYear() === now.getFullYear() &&
    a.getMonth() === now.getMonth() &&
    a.getDate() === now.getDate()
  )
}
