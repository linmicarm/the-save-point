import { describe, it, expect, beforeEach } from 'vitest'
import { pushRecent, togglePin, loadList, saveList } from './navPrefs'

describe('pushRecent', () => {
  it('puts the newest first and drops duplicates', () => {
    expect(pushRecent(['/a', '/b'], '/b')).toEqual(['/b', '/a'])
  })
  it('caps the list', () => {
    expect(pushRecent(['/a', '/b', '/c'], '/d')).toEqual(['/d', '/a', '/b'])
  })
})

describe('togglePin', () => {
  it('adds and removes', () => {
    expect(togglePin([], '/a')).toEqual(['/a'])
    expect(togglePin(['/a', '/b'], '/a')).toEqual(['/b'])
  })
  it('stops at the max instead of evicting', () => {
    const full = ['/1', '/2', '/3', '/4', '/5']
    expect(togglePin(full, '/6')).toEqual(full)
  })
})

describe('loadList / saveList', () => {
  beforeEach(() => localStorage.clear())
  it('round-trips and filters out unknown paths', () => {
    saveList('k', ['/a', '/gone'])
    expect(loadList('k', ['/a', '/b'])).toEqual(['/a'])
  })
  it('survives garbage', () => {
    localStorage.setItem('k', '{not json')
    expect(loadList('k', ['/a'])).toEqual([])
  })
})
