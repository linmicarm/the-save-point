// Tiny pure helpers for the menu's "recent" and "pinned" rows, plus safe localStorage access
// (storage can be blocked or empty — the menu must still work without it).

export const MAX_RECENT = 3
export const MAX_PINS = 5

// newest first, no duplicates, capped
export function pushRecent(list, path, max = MAX_RECENT) {
  return [path, ...list.filter(p => p !== path)].slice(0, max)
}

// adds if missing (up to max), removes if present
export function togglePin(list, path, max = MAX_PINS) {
  if (list.includes(path)) return list.filter(p => p !== path)
  if (list.length >= max) return list
  return [...list, path]
}

export function loadList(key, valid) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(raw) ? raw.filter(p => typeof p === 'string' && valid.includes(p)) : []
  } catch {
    return []
  }
}

export function saveList(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)) } catch { /* ignore */ }
}
