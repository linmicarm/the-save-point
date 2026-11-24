import { useEffect, useState } from 'react'
import axios from 'axios'
import Button from './Button'
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

export default function WeatherCheckIn({ onWeather }) {
  const [loading, setLoading]   = useState(true)
  const [today, setToday]       = useState(null)   // today's latest check-in, if any
  const [changing, setChanging] = useState(false)
  const [expanded, setExpanded] = useState(false)  // suggestion shown; open right after a check-in, collapsed on later visits
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    axios.get('/api/checkins', { params: { limit: 5 } })
      .then(res => {
        const latest = res.data.checkIns.find(c => isSameLocalDay(c.createdAt))
        setToday(latest || null)
        onWeather?.(latest?.weather ?? null)
      })
      .catch(() => {})            // the card is optional — fail quietly
      .finally(() => setLoading(false))
  }, [onWeather])

  const pick = async (weather) => {
    setSaving(true)
    setError('')
    try {
      const res = await axios.post('/api/checkins', { weather, note })
      setToday(res.data.checkIn)
      onWeather?.(weather)
      setNote('')
      setChanging(false)
      setExpanded(true)
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
    <div className={`rounded-2xl mb-6 ${showPicker || expanded ? 'p-5' : 'px-5 py-4'}`} style={card}>
      {(showPicker || expanded) && (
        <p className="text-[11px] mb-3 uppercase tracking-widest" style={label}>
          weather inside today
        </p>
      )}

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
            <div className="mt-2"><Button variant="quiet" onClick={() => setChanging(false)}>never mind</Button></div>
          )}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </>
      ) : (
        <>
          {/* slim summary row — tap to show or hide the suggestion */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center gap-3 text-left"
            aria-expanded={expanded}
          >
            <span className="text-2xl leading-none">{meta?.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--sp-text)' }}>
                {meta?.label ?? today.weather}
              </span>
              {today.note && (
                <span className="text-xs italic ml-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-faint)' }}>
                  {today.note}
                </span>
              )}
            </span>
            <span className="text-xs shrink-0" style={label}>{expanded ? 'less' : 'more'}</span>
          </button>

          {expanded && (
            <>
              <p className="text-sm leading-relaxed italic mt-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
                {suggestionFor(today.weather)}
              </p>
              <div className="mt-3"><Button size="sm" onClick={() => setChanging(true)}>weather changed?</Button></div>
            </>
          )}
        </>
      )}
    </div>
  )
}
