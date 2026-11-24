import { describe, it, expect } from 'vitest'
import { stageFor, STAGES, isActive, tendedToday, stageIndex, skyFor, plantPositions } from './garden'

describe('stageFor', () => {
  it('starts as a seed', () => {
    expect(stageFor(0).name).toBe('seed')
  })

  it('sprouts after the first tend', () => {
    expect(stageFor(1).name).toBe('sprout')
    expect(stageFor(2).name).toBe('sprout')
  })

  it('moves through each stage at its threshold', () => {
    expect(stageFor(3).name).toBe('leafy')
    expect(stageFor(6).name).toBe('growing')
    expect(stageFor(10).name).toBe('blooming')
    expect(stageFor(50).name).toBe('blooming')
  })

  it('never goes backwards as the count rises', () => {
    let last = -1
    for (let n = 0; n <= 20; n++) {
      const idx = STAGES.indexOf(stageFor(n))
      expect(idx).toBeGreaterThanOrEqual(last)
      last = idx
    }
  })

  it('handles bad input without crashing', () => {
    expect(stageFor(undefined).name).toBe('seed')
    expect(stageFor(-4).name).toBe('seed')
  })
})

describe('isActive', () => {
  it('is false once a seed has been replanted', () => {
    expect(isActive({ replantedAt: '2026-11-24T10:00:00Z' })).toBe(false)
    expect(isActive({ replantedAt: null })).toBe(true)
  })
})

describe('tendedToday', () => {
  const now = new Date(2026, 10, 24, 15, 0, 0)

  it('is true when tended earlier the same local day', () => {
    expect(tendedToday({ lastTendedAt: new Date(2026, 10, 24, 8, 0, 0).toISOString() }, now)).toBe(true)
  })

  it('is false for yesterday or never', () => {
    expect(tendedToday({ lastTendedAt: new Date(2026, 10, 23, 23, 0, 0).toISOString() }, now)).toBe(false)
    expect(tendedToday({ lastTendedAt: null }, now)).toBe(false)
  })
})

describe('stageIndex', () => {
  it('matches the stage order', () => {
    expect(stageIndex(0)).toBe(0)
    expect(stageIndex(1)).toBe(1)
    expect(stageIndex(3)).toBe(2)
    expect(stageIndex(6)).toBe(3)
    expect(stageIndex(10)).toBe(4)
  })
})

describe('skyFor', () => {
  it('has a distinct sky for each weather', () => {
    const skies = ['sunny', 'cloudy', 'rainy', 'stormy'].map(w => skyFor(w).top)
    expect(new Set(skies).size).toBe(4)
  })

  it('falls back to a soft default sky', () => {
    expect(skyFor(null)).toEqual(skyFor('tornado'))
    expect(skyFor(undefined).top).toEqual(expect.any(String))
  })
})

describe('plantPositions', () => {
  it('returns one position per plant, left to right, inside the scene', () => {
    const xs = plantPositions(4, 320)
    expect(xs).toHaveLength(4)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    expect(xs[0]).toBeGreaterThan(0)
    expect(xs[3]).toBeLessThan(320)
  })

  it('centres a single plant', () => {
    expect(plantPositions(1, 320)).toEqual([160])
  })

  it('returns nothing for an empty garden', () => {
    expect(plantPositions(0)).toEqual([])
  })
})
