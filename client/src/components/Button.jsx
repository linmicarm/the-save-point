import { Link } from 'react-router-dom'

// One button for the whole app, in three tiers:
//   primary   — the main action on a screen (filled accent pill)
//   secondary — other real actions: edit, manage, replant… (outlined pill)
//   quiet     — dismissing only: "not yet", "never mind" (plain text)
// Pass `to` to render a router Link, `color` to tint a primary button (e.g. a season color),
// and `full` for a full-width button. Everything else is passed through to the element.

const SIZES = {
  sm: 'text-xs px-3.5 py-1.5',
  md: 'text-[13px] px-4 py-2',
  lg: 'text-sm px-5 py-2.5',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  to,
  color,
  full = false,
  className = '',
  style,
  children,
  ...props
}) {
  let cls, st

  if (variant === 'primary') {
    cls = `${SIZES[size]} rounded-full font-medium text-white hover:opacity-90`
    st = { background: color || '#a89bc2' }
  } else if (variant === 'quiet') {
    cls = 'text-sm px-1 py-1.5 hover:opacity-70'
    st = { color: 'var(--sp-text-faint)', fontFamily: 'var(--font-hand)' }
  } else {
    cls = `${SIZES[size]} rounded-full font-medium border bg-transparent hover:bg-[var(--sp-surface-2)] hover:border-[var(--sp-text-faint)]`
    st = { color: 'var(--sp-text-muted)', borderColor: 'var(--sp-border)' }
  }

  const classes = [
    'inline-flex items-center justify-center transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    full ? 'w-full' : '',
    cls,
    className,
  ].filter(Boolean).join(' ')
  const styles = { ...st, ...style }

  if (to) {
    return <Link to={to} className={classes} style={styles} {...props}>{children}</Link>
  }
  return (
    <button type="button" className={classes} style={styles} {...props}>{children}</button>
  )
}
