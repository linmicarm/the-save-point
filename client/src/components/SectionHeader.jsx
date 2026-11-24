import { Link } from 'react-router-dom'

export default function SectionHeader({ label, accent, accentRgb, linkTo }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {/* accent mark — a single dot with the user's color */}
      <span
        className="shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ background: accent, boxShadow: `0 0 0 3px rgba(${accentRgb}, 0.15)` }}
      />
      {/* section label in Fraunces — distinctive but light */}
      <p
        className="text-[13px] tracking-wide"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          color: 'var(--sp-text)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </p>
      {/* rule */}
      <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.15)` }} />
      {linkTo && (
        <Link
          to={linkTo}
          className="text-[11px] shrink-0 transition-opacity hover:opacity-100"
          style={{ fontFamily: 'var(--font-hand)', color: `rgba(${accentRgb}, 0.6)`, opacity: 0.75 }}
        >
          see all →
        </Link>
      )}
    </div>
  )
}
