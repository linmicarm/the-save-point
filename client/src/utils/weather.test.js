import { describe, it, expect } from 'vitest'
import { WEATHER, suggestionFor, weatherMeta, isSameLocalDay } from './weather'

describe('suggestionFor', () => {
  it('returns a suggestion for every weather type', () => {
    for (const w of WEATHER) {
      expect(suggestionFor(w.key)).toEqual(expect.any(String))
      expect(suggestionFor(w.key).length).toBeGreaterThan(0)
    }
  })

  it('gives different suggestions for different weather', () => {
    const all = new Set(WEATHER.map(w => suggestionFor(w.key)))
    expect(all.size).toBe(WEATHER.length)
  })

  it('falls back gracefully for unknown values', () => {
    expect(suggestionFor('tornado')).toMatch(/showed up/)
    expect(suggestionFor(undefined)).toMatch(/showed up/)
  })
})

describe('weatherMeta', () => {
  it('finds a known weather', () => {
    expect(weatherMeta('rainy').emoji).toBe('🌧️')
  })

  it('returns null for unknown weather', () => {
    expect(weatherMeta('nope')).toBeNull()
  })
})

describe('isSameLocalDay', () => {
  const now = new Date(2024, 5, 15, 14, 0, 0) // local time, June 15 2024

  it('is true earlier the same local day', () => {
    expect(isSameLocalDay(new Date(2024, 5, 15, 1, 0, 0).toISOString(), now)).toBe(true)
  })

  it('is false for the previous day', () => {
    expect(isSameLocalDay(new Date(2024, 5, 14, 23, 59, 0).toISOString(), now)).toBe(false)
  })

  it('is false for the same day in a different month', () => {
    expect(isSameLocalDay(new Date(2024, 4, 15, 14, 0, 0).toISOString(), now)).toBe(false)
  })
})
