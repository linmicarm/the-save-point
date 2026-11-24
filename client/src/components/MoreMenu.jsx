import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV_SECTIONS } from '../utils/navSections'

// Everything in the app, in one calm panel. A dropdown under the navbar on desktop,
// a sheet above the tab bar on mobile. Closes on a link, outside tap or Escape.

export default function MoreMenu({ open, onClose }) {
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label="all pages"
        className="fixed z-[56] left-0 right-0 bottom-[3.6rem] max-h-[70vh] overflow-y-auto rounded-t-2xl p-5
                   lg:left-auto lg:right-4 lg:top-14 lg:bottom-auto lg:w-[22rem] lg:rounded-2xl lg:max-h-[calc(100vh-4.5rem)]"
        style={{
          background: 'var(--sp-surface)',
          border: '1px solid var(--sp-border)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div className="space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p
                className="text-[11px] mb-1.5 px-2 uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }}
              >
                {section.label}
              </p>
              <div className="grid grid-cols-2 gap-x-1">
                {section.items.map(item => {
                  const active = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className="px-2 py-1.5 rounded-xl text-[13px] transition-colors hover:bg-[var(--sp-surface-2)]"
                      style={{
                        color: active ? 'var(--sp-text)' : 'var(--sp-text-muted)',
                        background: active ? 'var(--sp-surface-2)' : undefined,
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
