import { useState } from 'react'
import { Link } from 'react-router-dom'

const STEPS = [
  {
    emoji: '✦',
    title: 'welcome to your save point',
    body: "This is your personal almanac — a quiet corner of the internet that's entirely yours. Log your days, track your seasons, collect what matters.",
    cta: null,
  },
  {
    emoji: '🌱',
    title: 'start a season',
    body: 'Seasons are chapters of your life. Name this one, give it a color, set an intention. You can end it whenever it feels right.',
    cta: { label: 'start a season →', to: '/seasons' },
  },
  {
    emoji: '📓',
    title: 'write your first entry',
    body: 'The journal is your daily companion. No pressure — a single sentence counts. You can attach a mood, a prompt, or just free-write.',
    cta: { label: 'open journal →', to: '/journal' },
  },
  {
    emoji: '🔮',
    title: "tell the world what you're up to",
    body: 'The Now page is a living snapshot of this moment — what you\'re focused on, building, learning, feeling. Update it whenever life shifts.',
    cta: { label: 'edit my now →', to: '/now' },
  },
  {
    emoji: '🗺️',
    title: 'you\'re all set',
    body: 'Explore at your own pace. The sidebar has everything — milestones, letters, a commonplace book, places, recipes, habits, and more.',
    cta: null,
  },
]

export default function OnboardingModal({ onClose }) {

  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e8e3f0]">

        {/* progress dots */}
        <div className="flex justify-center gap-1.5 pt-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all"
              style={{
                width:  i === step ? 20 : 6,
                height: 6,
                background: i === step ? '#c4b5fd' : '#e4dff0',
              }}
            />
          ))}
        </div>

        {/* content */}
        <div className="px-8 py-8 text-center">
          <div className="text-5xl mb-5">{current.emoji}</div>
          <h2
            className="text-xl font-medium text-[#2d2a35] mb-3 leading-snug"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {current.title}
          </h2>
          <p className="text-[14px] text-[#7c6f9b] leading-relaxed">
            {current.body}
          </p>
        </div>

        {/* actions */}
        <div className="px-8 pb-8 flex flex-col gap-2.5">
          {current.cta && (
            <Link
              to={current.cta.to}
              onClick={onClose}
              className="w-full py-2.5 rounded-full text-sm font-medium text-white text-center transition-colors"
              style={{ background: '#c4b5fd' }}
              onMouseEnter={e => e.currentTarget.style.background = '#a89bc2'}
              onMouseLeave={e => e.currentTarget.style.background = '#c4b5fd'}
            >
              {current.cta.label}
            </Link>
          )}

          {isLast ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{ background: '#c4b5fd', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#a89bc2'}
              onMouseLeave={e => e.currentTarget.style.background = '#c4b5fd'}
            >
              take me to my save point ✦
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="w-full py-2.5 rounded-full text-sm text-[#a89bc2] hover:text-[#5a5065] transition-colors border border-[#e4dff0] hover:border-[#c4b8d9]"
            >
              {current.cta ? 'skip for now' : 'next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
