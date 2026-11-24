import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Back/forward returns you to where you were; new pages start at the top.
// Positions are remembered per history entry (location.key) for this tab.
// Pages load their content asynchronously, so a restore keeps retrying
// until the page is tall enough to scroll there (or ~2.5s passes).
const positions = new Map()

export default function ScrollMemory() {
  const location = useLocation()
  const navType = useNavigationType()
  const keyRef = useRef(location.key)

  // keep the ref pointing at the current entry before anything else reacts to the navigation
  useLayoutEffect(() => { keyRef.current = location.key }, [location.key])

  // we manage scroll ourselves — the browser's own restore fires before content exists
  useEffect(() => {
    const prev = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = prev }
  }, [])

  // remember where we are on the current entry
  useEffect(() => {
    const onScroll = () => positions.set(keyRef.current, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // on navigation: restore (back/forward) or reset (new page)
  useLayoutEffect(() => {
    rememberPath(location.pathname)
    const saved = navType === 'POP' ? positions.get(location.key) : undefined
    if (!saved) {
      if (navType !== 'REPLACE') window.scrollTo(0, 0)
      return
    }
    let frame
    const started = performance.now()
    const tryRestore = () => {
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo(0, Math.min(saved, Math.max(maxY, 0)))
      const reached = Math.abs(window.scrollY - saved) < 2
      if (!reached && performance.now() - started < 2500) frame = requestAnimationFrame(tryRestore)
    }
    tryRestore()
    return () => cancelAnimationFrame(frame)
  }, [location.key, location.pathname, navType])

  return null
}

// Which path sits one step back in this tab's history? BackLink uses it to decide
// whether "← your page" should step back (restoring scroll) or push a new entry.
const pathByIdx = new Map()
export function previousPath() {
  const idx = window.history.state?.idx
  return typeof idx === 'number' ? pathByIdx.get(idx - 1) : undefined
}
export function rememberPath(pathname) {
  const idx = window.history.state?.idx
  if (typeof idx === 'number') pathByIdx.set(idx, pathname)
}
