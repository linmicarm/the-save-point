import { useId } from 'react'
import { stageFor, stageIndex, skyFor, plantPositions } from '../utils/garden'

// The garden, drawn. Everything here is computed from your seeds: each plant's growth comes
// from how many times you've tended it, and the sky comes from today's weather check-in.
// Plants only ever grow — weather never touches them.

const W = 320
const H = 140
const GROUND = 112          // y of the soil line the plants stand on
const STEM = '#6f9d57'
const LEAF = '#86b86b'
const LEAF_DARK = '#76a85d'
const SOIL = '#5a3f2b'

function Leaf({ x, y, flip = 1, size = 1, dark = false }) {
  return (
    <ellipse
      cx={x} cy={y} rx={6.5 * size} ry={3 * size}
      fill={dark ? LEAF_DARK : LEAF}
      transform={`rotate(${-32 * flip} ${x} ${y})`}
    />
  )
}

function Plant({ x, stage, color }) {
  const stemHeights = [0, 15, 28, 42, 54]
  const h = stemHeights[stage]

  return (
    <g transform={`translate(${x} ${GROUND})`}>
      {/* soil mound */}
      <path d="M-11 0 Q0 -9 11 0 Z" fill={SOIL} />

      {stage === 0 && <ellipse cx="0" cy="-5.5" rx="3" ry="2" fill="#a07850" />}

      {stage >= 1 && (
        <>
          <line x1="0" y1="-4" x2="0" y2={-h} stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
          <Leaf x={-5} y={-h * 0.55} flip={-1} />
          <Leaf x={5} y={-h * 0.7} flip={1} />
        </>
      )}

      {stage >= 2 && (
        <>
          <Leaf x={-6} y={-h * 0.3} flip={-1} dark />
          <Leaf x={6} y={-h * 0.42} flip={1} dark />
        </>
      )}

      {stage >= 3 && (
        <>
          <Leaf x={-7} y={-h * 0.85} flip={-1} size={1.15} />
          <Leaf x={7} y={-h * 0.15} flip={1} size={1.15} dark />
          {stage === 3 && <circle cx="0" cy={-h - 3} r="3.4" fill={color} opacity="0.85" />}
        </>
      )}

      {stage === 4 && (
        <g transform={`translate(0 ${-h - 4})`}>
          {[0, 60, 120, 180, 240, 300].map(a => (
            <circle
              key={a} r="5.2" fill={color}
              cx={Math.round(Math.cos((a * Math.PI) / 180) * 6.5 * 100) / 100}
              cy={Math.round(Math.sin((a * Math.PI) / 180) * 6.5 * 100) / 100}
            />
          ))}
          <circle r="4.2" fill="#f4d58d" />
        </g>
      )}
    </g>
  )
}

function Cloud({ x, y, fill, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill}>
      <ellipse cx="0" cy="0" rx="22" ry="9" />
      <circle cx="-8" cy="-7" r="9" />
      <circle cx="7" cy="-9" r="11" />
    </g>
  )
}

function Sky({ weather }) {
  if (weather === 'sunny') {
    return (
      <g>
        <circle cx="262" cy="34" r="20" fill="#ffe9a8" opacity="0.5" />
        <circle cx="262" cy="34" r="12" fill="#fff4cc" />
      </g>
    )
  }
  if (weather === 'cloudy') {
    return (
      <g>
        <Cloud x={80} y={36} fill="#eef1f4" scale={1.1} />
        <Cloud x={230} y={52} fill="#e4e8ec" />
      </g>
    )
  }
  if (weather === 'rainy' || weather === 'stormy') {
    const stormy = weather === 'stormy'
    const drops = [[40, 56], [78, 70], [115, 52], [150, 74], [188, 58], [226, 72], [262, 54], [296, 68], [58, 88], [134, 92], [206, 90], [280, 90]]
    return (
      <g>
        <Cloud x={90} y={30} fill={stormy ? '#2d3245' : '#8999a8'} scale={1.2} />
        <Cloud x={220} y={36} fill={stormy ? '#363b50' : '#7f8f9e'} scale={1.1} />
        {drops.map(([dx, dy]) => (
          <line key={`${dx}-${dy}`} x1={dx} y1={dy} x2={dx - 3} y2={dy + 9} stroke="#cfe0ee" strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
        ))}
        {stormy && <polygon points="170,40 160,62 168,62 162,80 180,56 171,56 177,40" fill="#fbe38a" />}
      </g>
    )
  }
  return null
}

export default function GardenScene({ seeds, weather, color = '#c4b5fd' }) {
  const sky = skyFor(weather)
  const skyId = `garden-sky-${useId().replace(/:/g, '')}`   // unique per scene, so gradients never collide
  const xs = plantPositions(seeds.length, W)
  const summary = seeds.length
    ? `your garden: ${seeds.map(s => `${s.title} (${stageFor(s.actionCount).name})`).join(', ')}`
    : 'your garden, waiting for its first seed'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto rounded-xl block"
      role="img"
      aria-label={summary}
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${skyId})`} />
      <Sky weather={weather} />

      {/* far hill, near hill, soil */}
      <path d={`M0 ${GROUND - 18} Q80 ${GROUND - 36} 170 ${GROUND - 16} T${W} ${GROUND - 22} V${H} H0 Z`} fill="#8fb37d" opacity="0.75" />
      <path d={`M0 ${GROUND - 4} Q90 ${GROUND - 14} 190 ${GROUND - 3} T${W} ${GROUND - 6} V${H} H0 Z`} fill="#6d9660" />
      <rect y={GROUND} width={W} height={H - GROUND} fill="#4d3626" />

      {seeds.map((s, i) => (
        <g key={s.id}>
          <title>{`${s.title} — ${stageFor(s.actionCount).name}`}</title>
          <Plant x={xs[i]} stage={stageIndex(s.actionCount)} color={color} />
        </g>
      ))}
    </svg>
  )
}
