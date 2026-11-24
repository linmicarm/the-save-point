import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV_SECTIONS, NAV_PATHS, labelFor, roomFor, canonical } from '../utils/navSections'
import { pushRecent, togglePin, loadList, saveList } from '../utils/navPrefs'

// Everything in the app, in one calm panel. Opens showing only what you actually use:
// pages you pinned, pages you just visited, then a handful of "rooms" that open one at a time.
// A dropdown under the navbar on desktop, a sheet above the tab bar on mobile.
// Closes on a link, outside tap or Escape.

const RECENT_KEY = 'sp_nav_recent'
const PINS_KEY = 'sp_nav_pins'
const hand = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }

export default function MoreMenu({ open, onClose }) {
  const location = useLocation()
  const [recent, setRecent] = useState(() => loadList(RECENT_KEY, NAV_PATHS))
  const [pins, setPins]     = useState(() => loadList(PINS_KEY, NAV_PATHS))
  const [openRoom, setOpenRoom] = useState(null)

  // remember the pages you visit
  useEffect(() => {
    const here = canonical(location.pathname)
    if (!here) return
    setRecent(prev => {
      const next = pushRecent(prev, here)
      saveList(RECENT_KEY, next)
      return next
    })
  }, [location.pathname])

  // each time the menu opens: the room you're standing in is open, the rest closed
  useEffect(() => {
    if (open) setOpenRoom(roomFor(location.pathname))
  }, [open, location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const pin = (path) => setPins(prev => {
    const next = togglePin(prev, path)
    saveList(PINS_KEY, next)
    return next
  })

  if (!open) return null

  const here = canonical(location.pathname)
  const recents = recent.filter(p => !pins.includes(p) && p !== here)

  const Row = ({ to, label, showPin }) => {
    const active = here === to
    const pinned = pins.includes(to)
    return (
      <div className="flex items-center rounded-xl hover:bg-[var(--sp-surface-2)]"
           style={{ background: active ? 'var(--sp-surface-2)' : undefined }}>
        <Link
          to={to}
          onClick={onClose}
          className="flex-1 px-3 py-2 text-[13px]"
          style={{ color: active ? 'var(--sp-text)' : 'var(--sp-text-muted)' }}
          aria-current={active ? 'page' : undefined}
        >
          {label}
        </Link>
        {showPin && (
          <button
            type="button"
            onClick={() => pin(to)}
            aria-label={pinned ? `unpin ${label}` : `pin ${label}`}
            aria-pressed={pinned}
            title={pinned ? 'unpin' : pins.length >= 5 ? 'you can pin up to 5' : 'pin to the top'}
            className="px-3 py-2 text-sm"
            style={{ color: pinned ? 'var(--sp-text)' : 'var(--sp-text-faint)', opacity: pinned ? 1 : 0.7 }}
          >
            {pinned ? '★' : '☆'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label="all pages"
        className="fixed z-[56] left-0 right-0 bottom-[3.6rem] max-h-[70vh] overflow-y-auto rounded-t-2xl p-4
                   lg:left-auto lg:right-4 lg:top-14 lg:bottom-auto lg:w-[20rem] lg:rounded-2xl lg:max-h-[calc(100vh-4.5rem)]"
        style={{
          background: 'var(--sp-surface)',
          border: '1px solid var(--sp-border)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {pins.length > 0 && (
          <div className="mb-3">
            <p className="text-sm px-3 mb-0.5" style={hand}>pinned</p>
            {pins.map(p => <Row key={p} to={p} label={labelFor(p)} showPin />)}
          </div>
        )}

        {recents.length > 0 && (
          <div className="mb-3">
            <p className="text-sm px-3 mb-0.5" style={hand}>recent</p>
            {recents.map(p => <Row key={p} to={p} label={labelFor(p)} />)}
          </div>
        )}

        <p className="text-sm px-3 mb-1" style={hand}>rooms</p>
        <div className="space-y-0.5">
          {NAV_SECTIONS.map(section => {
            const isOpen = openRoom === section.label
            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => setOpenRoom(isOpen ? null : section.label)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] hover:bg-[var(--sp-surface-2)]"
                  style={{ color: 'var(--sp-text)' }}
                >
                  <span>{section.label}</span>
                  <span style={{ color: 'var(--sp-text-faint)' }} aria-hidden>
                    {isOpen ? '−' : section.items.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="ml-3 mb-1 pl-2" style={{ borderLeft: '1px solid var(--sp-border-faint)' }}>
                    {section.items.map(item => <Row key={item.to} to={item.to} label={item.label} showPin />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </>
  )
}
