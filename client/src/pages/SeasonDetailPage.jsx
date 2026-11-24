import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

// One season, opened up: its words, the entries written during it, and the
// quiet housekeeping (edit reflection, delete) that used to crowd the list.

const label = { fontFamily: 'var(--font-hand)', color: 'var(--sp-text-faint)' }

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
}
function duration(startedAt, endedAt) {
  const days = Math.floor((new Date(endedAt || Date.now()) - new Date(startedAt)) / 86400000)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`
  if (days < 30) return `${Math.floor(days / 7)} weeks`
  if (days < 365) return `${Math.floor(days / 30)} months`
  return `${(days / 365).toFixed(1)} years`
}

export default function SeasonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [season, setSeason]   = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  const [editing, setEditing]       = useState(false)
  const [reflection, setReflection] = useState('')
  const [saving, setSaving]         = useState(false)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting]                 = useState(false)
  const [error, setError]                       = useState('')

  useEffect(() => {
    Promise.all([
      axios.get(`/api/seasons/${id}`),
      axios.get('/api/journal', { params: { seasonId: id, limit: 100 } }),
    ])
      .then(([s, e]) => {
        setSeason(s.data.season)
        setReflection(s.data.season.reflection || '')
        setEntries(e.data.entries || [])
      })
      .catch(err => { if (err.response?.status === 404) setMissing(true) })
      .finally(() => setLoading(false))
  }, [id])

  const saveReflection = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await axios.patch(`/api/seasons/${id}`, { reflection })
      setSeason(res.data.season)
      setEditing(false)
    } catch {
      setError('Could not save — try again.')
    } finally {
      setSaving(false)
    }
  }

  const removeSeason = async () => {
    setDeleting(true)
    setError('')
    try {
      await axios.delete(`/api/seasons/${id}`)
      navigate('/seasons', { replace: true })
    } catch {
      setError('Could not delete — try again.')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sp-bg)' }}>
      <p className="text-sm animate-pulse" style={label}>✦</p>
    </div>
  )

  if (missing || !season) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--sp-bg)' }}>
      <p className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>that season isn't here anymore.</p>
      <Button to="/seasons">back to seasons</Button>
    </div>
  )

  const isActive = !season.endedAt

  return (
    <div className="min-h-screen" style={{ background: 'var(--sp-bg)' }}>
      <div className="h-1 w-full" style={{ background: season.color }} />
      <div className="max-w-lg mx-auto px-5 py-10">

        <div className="mb-8 flex items-center justify-between">
          <BackLink to="/seasons" className="text-xs" style={{ color: 'var(--sp-text-faint)' }}>← all seasons</BackLink>
          {isActive && <Button size="sm" to="/home">today's home</Button>}
        </div>

        {/* header */}
        <header className="mb-8">
          <p className="text-3xl mb-2 leading-none">{season.emoji}</p>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
              {season.name}
            </h1>
            {isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: season.color, color: '#2d2a35' }}>
                active
              </span>
            )}
          </div>
          <p className="text-sm" style={label}>
            {fmt(season.startedAt)} — {isActive ? 'ongoing' : fmt(season.endedAt)} · {duration(season.startedAt, season.endedAt)}
          </p>
          {season.intention && (
            <p className="text-sm italic mt-3 leading-relaxed" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
              "{season.intention}"
            </p>
          )}
        </header>

        {/* reflection */}
        <section className="mb-8">
          <p className="text-[11px] uppercase tracking-widest mb-2" style={label}>reflection</p>
          {editing ? (
            <div>
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="looking back, what defined this season for you?"
                rows={4}
                autoFocus
                className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none resize-none leading-relaxed"
                style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)', color: 'var(--sp-text)' }}
              />
              <div className="flex gap-2 mt-2">
                <Button variant="primary" size="sm" onClick={saveReflection} disabled={saving}>
                  {saving ? 'saving...' : 'save'}
                </Button>
                <Button variant="quiet" onClick={() => { setEditing(false); setReflection(season.reflection || '') }}>cancel</Button>
              </div>
            </div>
          ) : season.reflection ? (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--sp-text)' }}>{season.reflection}</p>
              <div className="mt-3"><Button size="sm" onClick={() => setEditing(true)}>edit reflection</Button></div>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>+ add a reflection</Button>
          )}
        </section>

        {/* closing words */}
        {(season.carryForward || season.released) && (
          <section className="mb-8 space-y-4">
            {season.carryForward && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={label}>carried forward</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--sp-text)' }}>{season.carryForward}</p>
              </div>
            )}
            {season.released && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={label}>let go</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--sp-text)' }}>{season.released}</p>
              </div>
            )}
          </section>
        )}

        {/* entries */}
        <section className="mb-10">
          <p className="text-[11px] uppercase tracking-widest mb-2" style={label}>
            written in this season{entries.length ? ` · ${entries.length}` : ''}
          </p>
          {entries.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--sp-text-faint)' }}>nothing written here yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map(e => (
                <Link
                  key={e.id}
                  to="/journal"
                  className="flex items-start gap-3 rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
                  style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border-faint)' }}
                >
                  <span className="text-[11px] shrink-0 pt-0.5" style={label}>{shortDate(e.createdAt)}</span>
                  <span className="text-sm leading-snug" style={{ fontFamily: 'var(--font-serif)', color: 'var(--sp-text-muted)' }}>
                    {e.mood && <span className="mr-1.5">{e.mood}</span>}
                    {e.body.length > 140 ? `${e.body.slice(0, 140)}…` : e.body}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* delete */}
        <footer className="pt-4" style={{ borderTop: '1px solid var(--sp-border-faint)' }}>
          {confirmingDelete ? (
            <div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--sp-text-muted)' }}>
                this removes the season only. your entries, check-ins and seeds stay in your journal.
              </p>
              <div className="flex gap-2 items-center">
                <Button size="sm" onClick={removeSeason} disabled={deleting}>{deleting ? 'deleting...' : 'delete season'}</Button>
                <Button variant="quiet" onClick={() => setConfirmingDelete(false)}>keep it</Button>
              </div>
            </div>
          ) : (
            <Button variant="quiet" onClick={() => setConfirmingDelete(true)}>delete this season</Button>
          )}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </footer>
      </div>
    </div>
  )
}
