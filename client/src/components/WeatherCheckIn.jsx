import { useEffect, useState } from 'react'
import axios from 'axios'
import { WEATHER, suggestionFor, weatherMeta, isSameLocalDay } from '../utils/weather'

// "what's the weather inside today?" — a gentle capacity check-in.
// Picking a weather saves it immediately; the optional note is saved with it.
export default function WeatherCheckIn() {
  const [loading, setLoading] = useState(true)
  const [today, setToday]     = useState(null)   // today's latest check-in, if any
  const [changing, setChanging] = useState(false)
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

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
    <div className="bg-white border border-[#ede9f5] rounded-2xl p-5 mb-6">
      <p className="text-xs font-medium text-[#a89bc2] uppercase tracking-widest mb-3">
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
                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-[#e4dff0] bg-[#faf8ff] hover:border-[#c4b5fd] hover:bg-[#c4b5fd18] transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">{w.emoji}</span>
                <span className="text-[11px] text-[#7c6f9b]">{w.label}</span>
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={280}
            placeholder="a few words, if you want (optional)"
            className="w-full mt-3 px-3 py-2 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-xs text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
          />
          {changing && (
            <button
              onClick={() => setChanging(false)}
              className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] mt-2 transition-colors"
            >
              never mind
            </button>
          )}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta?.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                {meta?.label ?? today.weather}
              </p>
              {today.note && <p className="text-xs text-[#a89bc2] italic truncate">{today.note}</p>}
            </div>
          </div>
          <p className="text-sm text-[#5a5065] leading-relaxed mt-3">
            {suggestionFor(today.weather)}
          </p>
          <button
            onClick={() => setChanging(true)}
            className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] mt-3 transition-colors"
          >
            weather changed?
          </button>
        </>
      )}
    </div>
  )
}
