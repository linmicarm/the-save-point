import { useEffect, useState } from 'react'
import axios from 'axios'
import Button from './Button'
import { stageFor, isActive, tendedToday } from '../utils/garden'

// Seeds: a few small things you're tending this season. Tending one grows it;
// "replant" shrinks a seed that feels too big into a smaller one — the old plant
// stays in the garden. Nothing here ever wilts or counts against you.

const label = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }
const card = {
  background: 'var(--sp-surface)',
  border: '1px solid var(--sp-border)',
  boxShadow: '0 1px 6px rgba(59,47,47,0.04)',
}
const inputStyle = {
  background: 'var(--sp-surface-2)',
  border: '1px solid var(--sp-border-faint)',
  color: 'var(--sp-text)',
  fontFamily: 'var(--font-serif)',
}

export default function SeedGarden() {
  const [seeds, setSeeds]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [title, setTitle]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [replanting, setReplanting] = useState(null)   // seed id being replanted
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    axios.get('/api/seeds')
      .then(res => setSeeds(res.data.seeds))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try { await fn() }
    catch (err) { setError(err.response?.data?.error || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const plant = () => title.trim() && run(async () => {
    const res = await axios.post('/api/seeds', { title })
    setSeeds(prev => [...prev, res.data.seed])
    setTitle('')
  })

  const tend = (id) => run(async () => {
    const res = await axios.post(`/api/seeds/${id}/tend`, {})
    setSeeds(prev => prev.map(s => s.id === id ? res.data.seed : s))
  })

  const replant = (id) => newTitle.trim() && run(async () => {
    const res = await axios.post(`/api/seeds/${id}/replant`, { title: newTitle })
    setSeeds(prev => [...prev.map(s => s.id === id ? res.data.replanted : s), res.data.seed])
    setReplanting(null)
    setNewTitle('')
  })

  if (loading) return null

  const active = seeds.filter(isActive)

  return (
    <div className="rounded-2xl p-5 mb-6" style={card}>
      <p className="text-[11px] mb-3 uppercase tracking-widest" style={label}>your garden</p>

      {/* the garden itself — every seed you've planted this season, replanted ones included */}
      {seeds.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 mb-4 text-3xl leading-none" aria-label="your garden">
          {seeds.map(s => (
            <span key={s.id} title={`${s.title} — ${stageFor(s.actionCount).name}`}>
              {stageFor(s.actionCount).emoji}
            </span>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <p className="text-sm italic mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
          plant one small thing for this season — something you can do a little at a time.
        </p>
      )}

      <ul className="space-y-3">
        {active.map(s => (
          <li key={s.id}>
            <div className="flex items-center gap-3">
              <span className="text-xl leading-none">{stageFor(s.actionCount).emoji}</span>
              <span className="flex-1 min-w-0 text-sm truncate" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text)' }}>
                {s.title}
              </span>
              {tendedToday(s) ? (
                <span className="text-xs" style={label}>tended today ✓</span>
              ) : (
                <Button size="sm" onClick={() => tend(s.id)} disabled={busy}>tend</Button>
              )}
              <Button
                size="sm"
                onClick={() => { setReplanting(replanting === s.id ? null : s.id); setNewTitle('') }}
                title="feels too big? plant a smaller version"
              >
                replant
              </Button>
            </div>

            {replanting === s.id && (
              <div className="mt-2 ml-8 flex gap-2">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && replant(s.id)}
                  maxLength={120}
                  autoFocus
                  placeholder="a smaller version of this…"
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                  style={inputStyle}
                />
                <Button variant="primary" size="sm" onClick={() => replant(s.id)} disabled={busy || !newTitle.trim()}>
                  replant
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && plant()}
          maxLength={120}
          placeholder="plant something small…"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs focus:outline-none"
          style={inputStyle}
        />
        <Button variant="primary" onClick={plant} disabled={busy || !title.trim()}>plant</Button>
      </div>

      {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
    </div>
  )
}
