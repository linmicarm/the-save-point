import { Link, useNavigate } from 'react-router-dom'
import { previousPath } from './ScrollMemory'

// "← your page" style links. If that page is exactly where you just came from,
// step back instead of pushing a new entry, so you land where you left off.
export default function BackLink({ to, onClick, ...props }) {
  const navigate = useNavigate()
  const handle = (e) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    if (typeof to === 'string' && previousPath() === to.split(/[?#]/)[0]) {
      e.preventDefault()
      navigate(-1)
    }
  }
  return <Link to={to} onClick={handle} {...props} />
}
