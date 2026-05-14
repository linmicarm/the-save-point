export default function SeasonBadge({ season, onClick, isOwn }) {
  if (!season) {
    if (!isOwn) return null
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors border border-dashed border-[#e4dff0] rounded-full px-3 py-1"
      >
        <span>✦</span>
        <span>start a season</span>
      </button>
    )
  }

  return (
    <button
      onClick={isOwn ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 transition-opacity ${isOwn ? 'hover:opacity-75' : ''}`}
      style={{
        background: `${season.color}22`,
        color: season.color,
        border: `1px solid ${season.color}44`,
      }}
    >
      <span>{season.emoji}</span>
      <span>{season.name}</span>
    </button>
  )
}
