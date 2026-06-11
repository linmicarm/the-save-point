import { Link } from 'react-router-dom'

export default function SectionHeader({ label, accent, accentRgb, linkTo }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex gap-0.5 shrink-0">
        <span className="block w-[7px] h-[7px] rounded-[2px]" style={{ background: accent }} />
        <span className="block w-[7px] h-[7px] rounded-[2px]" style={{ background: accent, opacity: 0.55 }} />
        <span className="block w-[7px] h-[7px] rounded-[2px]" style={{ background: accent, opacity: 0.2 }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: accent }}>{label}</p>
      <div className="flex-1 h-px" style={{ background: `rgba(${accentRgb}, 0.18)` }} />
      {linkTo && (
        <Link to={linkTo} className="text-[10px] shrink-0 transition-colors" style={{ color: `rgba(${accentRgb}, 0.45)` }}>
          see all →
        </Link>
      )}
    </div>
  )
}
