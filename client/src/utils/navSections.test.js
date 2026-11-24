import { describe, it, expect } from 'vitest'
import { NAV_SECTIONS, NAV_PATHS } from './navSections'
import appSource from '../App.jsx?raw'

describe('NAV_SECTIONS', () => {
  it('has no duplicate paths', () => {
    expect(new Set(NAV_PATHS).size).toBe(NAV_PATHS.length)
  })

  it('only uses absolute paths and non-empty labels', () => {
    for (const s of NAV_SECTIONS) {
      expect(s.label).toBeTruthy()
      for (const i of s.items) {
        expect(i.to.startsWith('/')).toBe(true)
        expect(i.label).toBeTruthy()
      }
    }
  })

  it('only links to routes that exist in App.jsx', () => {
    for (const to of NAV_PATHS) {
      expect(appSource, `no route for ${to}`).toContain(`path="${to}"`)
    }
  })
})

describe('folded pages', () => {
  it('maps a folded page to its menu entry', async () => {
    const { canonical, labelFor, roomFor } = await import('./navSections')
    expect(canonical('/week')).toBe('/habits')
    expect(canonical('/habits')).toBe('/habits')
    expect(canonical('/nope')).toBeNull()
    expect(labelFor('/year')).toBe('month & year')
    expect(roomFor('/capsule')).toBe('memories')
  })
})
