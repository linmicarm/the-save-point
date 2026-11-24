import { useEffect, useState } from 'react'
import axios from 'axios'
import { WEATHER, suggestionFor, weatherMeta, isSameLocalDay } from '../utils/weather'

// "what's the weather inside today?" — a gentle capacity check-in.
// Picking a weather saves it immediately; the optional note is saved with it.
// Styled with the --sp- design tokens so it matches the rest of the journal page.

const card = {
  background: 'var(--sp-surface)',
  border: '1px solid var(--sp-border)',
  boxShadow: '0 1px 6px rgba(59,47,47,0.04)',
}
const label = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }

export default function WeatherCheckIn() {
  const [loading, setLoading]   = useState(true)
  const [today, setToday]       = useState(null)   // today's latest check-in, if any
  const [changing, setChanging] = useState(false)
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    axios.get('/api/checkins', { params: { limit: 5 } })
      .then(res => {
        const latest = res.data.checkIns.find(c => isSameLocalDay(c.createdAt))
        setToday(latest || null)
      })
      .catch(() => {})            // the card is optional — fail quietly
      .finally(() => setLoading(false))
  }, [])

  const pick = async (weather) => {
    setSaving(true)
    setError('')
    try {
      const res = await axios.post('/api/checkins', { weather, note })
      setToday(res.data.checkIn)
      setNote('')
      setChanging(false)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const showPicker = !today || changing
  const meta = today ? weatherMeta(today.weather) : null

  return (
    <div className="rounded-2xl p-5 mb-6" style={card}>
      <p className="text-[11px] mb-3 uppercase tracking-widest" style={label}>
        weather inside today
      </p>

      {showPicker ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {WEATHER.map(w => (
              <button
                key={w.key}
                onClick={() => pick(w.key)}
                disabled={saving}
                title={w.hint}
                className="flex flex-col items-center gap-1 py-3 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--sp-surface-2)', border: '1px solid var(--sp-border-faint)' }}
              >
                <span className="text-2xl leading-none">{w.emoji}</span>
                <span className="text-xs" style={{ fontFamily: 'var(--font-hand)', color: 'var(--sp-text-muted)' }}>
                  {w.label}
                </span>
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={280}
            placeholder="a few words, if you want"
            className="w-full mt-3 px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{
              background: 'var(--sp-surface-2)',
              border: '1px solid var(--sp-border-faint)',
              color: 'var(--sp-text)',
              fontFamily: 'var(--font-serif)',
            }}
          />
          {changing && (
            <button onClick={() => setChanging(false)} className="text-xs mt-2 hover:opacity-70 transition-opacity" style={label}>
              never mind
            </button>
          )}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{meta?.emoji}</span>
            <div className="min-w-0">
              <p className="text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--sp-text)' }}>
                {meta?.label ?? today.weather}
              </p>
              {today.note && (
                <p className="text-xs italic truncate" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-faint)' }}>
                  {today.note}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed italic mt-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
            {suggestionFor(today.weather)}
          </p>
          <button onClick={() => setChanging(true)} className="text-xs mt-3 hover:opacity-70 transition-opacity" style={label}>
            weather changed?
          </button>
        </>
      )}
    </div>
  )
}
