import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const MOBILE_TABS = [
  { to: '/home',         label: 'home',      icon: '🌱' },
  { to: '/journal',      label: 'journal',   icon: '📓' },
  { to: 'profile',       label: 'me',        icon: '✦' },
  { to: '/notifications',label: 'alerts',    icon: '🔔' },
]

export default function MobileNav({ menuOpen = false, onMenu }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const tabs = MOBILE_TABS.map(t =>
    t.to === 'profile' ? { ...t, to: `/u/${user.username}` } : t
  )

  const tabClass = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t flex items-center"
      style={{ background: 'var(--sp-navbar-bg)', borderColor: 'var(--sp-border)', backdropFilter: 'blur(12px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, label, icon }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={tabClass}
            style={{ color: active ? '#c4b5fd' : 'var(--sp-text-faint)' }}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[9px] font-medium tracking-wide">{label}</span>
          </Link>
        )
      })}

      {/* everything else lives in the menu */}
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        className={tabClass}
        style={{ color: menuOpen ? '#c4b5fd' : 'var(--sp-text-faint)' }}
      >
        <span className="text-lg leading-none">☰</span>
        <span className="text-[9px] font-medium tracking-wide">more</span>
      </button>
    </nav>
  )
}
