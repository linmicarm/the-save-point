import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import axios from 'axios'

export default function Navbar() {
  const { user } = useAuth()
  const { dark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [unread, setUnread]         = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState(null)
  const [searching, setSearching]   = useState(false)
  const searchInputRef = useRef(null)

  // poll unread count
  useEffect(() => {
    if (!user) return
    const fetch = () =>
      axios.get('/api/notifications/unread').then(r => setUnread(r.data.count)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [user])

  // reset unread when visiting notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') setUnread(0)
  }, [location.pathname])

  // debounced search
  useEffect(() => {
    if (!query.trim() || !searchOpen) { setResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await axios.get(`/api/search?q=${encodeURIComponent(query.trim())}`)
        setResults(r.data)
      } catch { setResults({}) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, searchOpen])

  // keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setResults(null)
  }

  function handleResultClick(url) {
    navigate(url)
    closeSearch()
  }

  const RESULT_LABELS = {
    journal:     { label: 'Journal',      emoji: '📓' },
    milestones:  { label: 'Milestones',   emoji: '✦' },
    commonplace: { label: 'Commonplace',  emoji: '💬' },
    blog:        { label: 'Blog',         emoji: '✍️' },
    places:      { label: 'Places',       emoji: '📍' },
    recipes:     { label: 'Recipes',      emoji: '🍴' },
  }

  const hasResults = results && Object.values(results).some(arr => arr.length > 0)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-sm border-b flex items-center px-5 gap-3" style={{ background: 'var(--sp-navbar-bg)', borderColor: 'var(--sp-border)' }}>

        {/* logo */}
        <Link
          to={user ? '/home' : '/login'}
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="text-base transition-all group-hover:scale-110" style={{ color: '#c4b5fd', display: 'inline-block' }}>✦</span>
          <span
            className="text-[17px] tracking-tight transition-colors"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)', letterSpacing: '-0.02em' }}
          >
            save point
          </span>
        </Link>

        {user && (
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {[
              { to: '/home', label: 'home' },
              { to: '/journal', label: 'journal' },
              { to: `/u/${user.username}`, label: 'your page' },
            ].map(({ to, label }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 rounded-xl text-[13px] transition-colors"
                  style={{ color: active ? 'var(--sp-text)' : 'var(--sp-text-faint)', background: active ? 'var(--sp-surface-2)' : 'transparent' }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}

        <div className="flex-1" />

        {user ? (
          <div className="flex items-center gap-0.5">

            {/* theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-[15px]"
              style={{ color: 'var(--sp-text-faint)' }}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* search trigger */}
            <button
              onClick={openSearch}
              className="flex items-center gap-2 h-8 px-3 rounded-xl transition-colors text-[12px]"
              style={{ color: 'var(--sp-text-faint)' }}
              title="Search (⌘K)"
            >
              <SearchIcon />
              <span className="hidden sm:inline">search</span>
            </button>

            {/* notifications */}
            <Link
              to="/notifications"
              className="relative w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--sp-text-faint)' }}
              title="Notifications"
            >
              <BellIcon />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c4b5fd]" style={{ boxShadow: '0 0 0 2px var(--sp-navbar-bg)' }} />
              )}
            </Link>

            {/* avatar */}
            <Link
              to={`/u/${user.username}`}
              className="ml-1 w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-[#c4b5fd] transition-all"
              style={{ background: 'var(--sp-border)' }}
              title={user.displayName}
            >
              {user.avatarUrl
                ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                : <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
                    {user.displayName?.[0]?.toUpperCase() || '✦'}
                  </span>
              }
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-[13px] transition-colors px-3 py-1.5"
              style={{ color: 'var(--sp-text-faint)' }}
            >
              sign in
            </Link>
            <Link
              to="/register"
              className="text-[13px] px-4 py-1.5 rounded-full font-medium transition-colors text-white"
              style={{ background: '#a89bc2' }}
              onMouseEnter={e => e.currentTarget.style.background = '#7c6f9b'}
              onMouseLeave={e => e.currentTarget.style.background = '#a89bc2'}
            >
              join
            </Link>
          </div>
        )}
      </nav>

      {/* search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onMouseDown={e => { if (e.target === e.currentTarget) closeSearch() }}
        >
          <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border" style={{ background: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>

            {/* input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--sp-border)' }}>
              <SearchIcon className="shrink-0" style={{ color: 'var(--sp-text-faint)' }} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="search your save point…"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: 'var(--sp-text)', caretColor: '#c4b5fd' }}
                onKeyDown={e => { if (e.key === 'Escape') closeSearch() }}
              />
              {query
                ? <button onClick={() => { setQuery(''); setResults(null) }} className="text-sm transition-colors" style={{ color: 'var(--sp-text-faint)' }}>✕</button>
                : <kbd className="hidden sm:inline text-[10px] rounded px-1.5 py-0.5 border" style={{ color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}>esc</kbd>
              }
            </div>

            {/* results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {searching && (
                <p className="text-xs text-center py-10" style={{ color: 'var(--sp-text-faint)' }}>searching…</p>
              )}

              {!searching && query && !hasResults && results && (
                <p className="text-xs text-center py-10" style={{ color: 'var(--sp-text-faint)' }}>no results for "{query}"</p>
              )}

              {!searching && hasResults && Object.entries(results).map(([type, items]) => {
                if (!items?.length) return null
                const meta = RESULT_LABELS[type] || { label: type, emoji: '•' }
                return (
                  <div key={type} className="px-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--sp-border-faint)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5 px-2" style={{ color: 'var(--sp-text-faint)' }}>
                      {meta.emoji} {meta.label}
                    </p>
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.url)}
                        className="w-full text-left px-3 py-2 rounded-xl transition-colors"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--sp-surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <p className="text-[13px] truncate" style={{ color: 'var(--sp-text)' }}>{item.title}</p>
                        {item.excerpt && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--sp-text-faint)' }}>{item.excerpt}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}

              {!query && (
                <div className="px-6 py-8 text-center space-y-1">
                  <p className="text-[13px]" style={{ color: 'var(--sp-text-muted)' }}>search across everything</p>
                  <p className="text-[11px]" style={{ color: 'var(--sp-text-faint)' }}>journal · blog · milestones · places · recipes · commonplace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SearchIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
