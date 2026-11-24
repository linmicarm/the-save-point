import { Link, useLocation } from 'react-router-dom'

// Pages that belong together share a little tab switch at the top, so the menu can
// list them once. Switching replaces the history entry — Back skips the tab flips.

const GROUPS = {
  rhythm:  [{ to: '/habits', label: 'habits' }, { to: '/week', label: 'week' }],
  lookback: [{ to: '/month', label: 'month' }, { to: '/year', label: 'year' }],
  letters: [{ to: '/letters', label: 'letters' }, { to: '/capsule', label: 'time capsule' }],
}

export default function PageTabs({ group }) {
  const { pathname } = useLocation()
  const tabs = GROUPS[group]
  if (!tabs) return null
  return (
    <div
      role="tablist"
      className="inline-flex p-1 rounded-full mb-6"
      style={{ background: 'var(--sp-surface-2)', border: '1px solid var(--sp-border-faint)' }}
    >
      {tabs.map(t => {
        const active = pathname === t.to
        return (
          <Link
            key={t.to}
            to={t.to}
            replace
            role="tab"
            aria-selected={active}
            className="text-xs px-4 py-1.5 rounded-full transition-colors"
            style={{
              background: active ? 'var(--sp-surface)' : 'transparent',
              color: active ? 'var(--sp-text)' : 'var(--sp-text-faint)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              fontWeight: active ? 500 : 400,
            }}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
