import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hexToRgb, daysAgo, lastTended, fmtDate, timeAgo } from './format'

// ─── hexToRgb ────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('converts lavender accent colour to rgb triplet', () => {
    expect(hexToRgb('#c4b5fd')).toBe('196, 181, 253')
  })

  it('converts pure white #ffffff', () => {
    expect(hexToRgb('#ffffff')).toBe('255, 255, 255')
  })

  it('converts pure black #000000', () => {
    expect(hexToRgb('#000000')).toBe('0, 0, 0')
  })

  it('converts a rose accent colour', () => {
    expect(hexToRgb('#fda4af')).toBe('253, 164, 175')
  })
})

// ─── fmtDate ─────────────────────────────────────────────────────

describe('fmtDate', () => {
  it('formats an ISO date string as "Month D, YYYY"', () => {
    // Use a fixed UTC date and parse in local time
    const result = fmtDate('2024-03-15T12:00:00.000Z')
    // The day may shift by timezone — check shape rather than exact value
    expect(result).toMatch(/\w+ \d+, 2024/)
  })

  it('includes the full month name', () => {
    // January 1 2023
    const result = fmtDate('2023-01-01T00:00:00.000Z')
    // Month name is present somewhere in the string
    expect(result).toMatch(/January|December/)   // Dec 31 UTC → Jan 1 local possible
  })
})

// ─── daysAgo + lastTended (time-dependent) ────────────────────────

describe('daysAgo', () => {
  beforeEach(() => {
    // Pin Date.now to noon on 2024-06-15 (UTC)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0 for a timestamp less than 24 hours ago', () => {
    expect(daysAgo('2024-06-15T06:00:00.000Z')).toBe(0)
  })

  it('returns 1 for a timestamp exactly 25 hours ago', () => {
    expect(daysAgo('2024-06-14T11:00:00.000Z')).toBe(1)
  })

  it('returns 7 for a timestamp 7 days ago', () => {
    expect(daysAgo('2024-06-08T12:00:00.000Z')).toBe(7)
  })
})

describe('lastTended', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns "just now" for timestamps under 5 minutes ago', () => {
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    expect(lastTended(twoMinsAgo)).toBe('just now')
  })

  it('returns minutes for timestamps 5–59 minutes ago', () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(lastTended(tenMinsAgo)).toBe('10m ago')
  })

  it('returns hours for timestamps 1–23 hours ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    expect(lastTended(threeHrsAgo)).toBe('3h ago')
  })

  it('returns days for timestamps 1–6 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString()
    expect(lastTended(threeDaysAgo)).toBe('3d ago')
  })

  it('returns weeks for timestamps 7–29 days ago', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000).toISOString()
    expect(lastTended(twoWeeksAgo)).toBe('2w ago')
  })

  it('returns months for timestamps 30–364 days ago', () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 86400 * 1000).toISOString()
    expect(lastTended(threeMonthsAgo)).toBe('3mo ago')
  })

  it('returns years for timestamps 365+ days ago', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 86400 * 1000).toISOString()
    expect(lastTended(twoYearsAgo)).toBe('2y ago')
  })
})

// ─── timeAgo ─────────────────────────────────────────────────────

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns "just now" for sub-60-second timestamps', () => {
    const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString()
    expect(timeAgo(thirtySecsAgo)).toBe('just now')
  })

  it('returns minutes for 1–59 minutes ago', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(timeAgo(fiveMinsAgo)).toBe('5m ago')
  })

  it('returns hours for 1–23 hours ago', () => {
    const twoHrsAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    expect(timeAgo(twoHrsAgo)).toBe('2h ago')
  })

  it('returns days for 1–6 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()
    expect(timeAgo(threeDaysAgo)).toBe('3d ago')
  })

  it('returns a short date string for 7+ days ago', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString()
    // Should be a formatted date, not a relative label
    expect(timeAgo(tenDaysAgo)).toMatch(/Jun \d+/)
  })
})
