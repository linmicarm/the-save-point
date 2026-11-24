import { useState } from 'react'
import axios from 'axios'
import EmojiPicker from './EmojiPicker'
import { SEASON_TEMPLATES, applyTemplate } from '../utils/seasonTemplates'
import { stageFor, isActive } from '../utils/garden'

const COLOR_PRESETS = [
  '#c4b5fd', '#fda4af', '#86efac',
  '#fdba74', '#93c5fd', '#d4b896',
]

function TemplatePicker({ onPick }) {
  return (
    <div className="mb-4">
      <p className="text-xs text-[#a89bc2] mb-2">start from a transition <span className="text-[#d4cfe3]">(optional)</span></p>
      <div className="flex flex-wrap gap-2">
        {SEASON_TEMPLATES.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onPick(t)}
            className="text-xs px-3 py-1.5 rounded-full border border-[#e4dff0] bg-[#faf8ff] text-[#7c6f9b] hover:border-[#c4b5fd] hover:bg-[#c4b5fd18] transition-colors"
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SeasonModal({ season, onClose, onSave }) {
  const isNew = !season

  // 'edit' | 'ceremony' | 'closed'
  const [step, setStep] = useState('edit')

  const [form, setForm] = useState({
    name:      season?.name      || '',
    emoji:     season?.emoji     || '✦',
    color:     season?.color     || '#c4b5fd',
    intention: season?.intention || '',
    coverUrl:  season?.coverUrl  || '',
  })
  const [reflection, setReflection]     = useState(season?.reflection || '')
  const [carryForward, setCarryForward] = useState('')
  const [released, setReleased]         = useState('')
  const [summary, setSummary]           = useState(null)   // { seeds, entryCount } for the ceremony
  const [saving, setSaving]   = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError]     = useState('')

  const pickTemplate = (t) => setForm(f => ({ ...f, ...applyTemplate(t) }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Give your season a name.')
    setSaving(true)
    setError('')
    try {
      let res
      if (isNew) {
        res = await axios.post('/api/seasons', form)
      } else {
        res = await axios.patch(`/api/seasons/${season.id}`, form)
      }
      onSave(res.data.season)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // step 1: open the ceremony and gather what grew this season
  const beginCeremony = async () => {
    setError('')
    setStep('ceremony')
    const days = Math.max(1, Math.floor((Date.now() - new Date(season.startedAt)) / 86400000) + 1)
    try {
      const [seedsRes, entriesRes] = await Promise.all([
        axios.get('/api/seeds'),
        axios.get('/api/journal', { params: { seasonId: season.id, limit: 200 } }),
      ])
      setSummary({ days, seeds: seedsRes.data.seeds, entryCount: entriesRes.data.entries.length })
    } catch {
      setSummary({ days, seeds: [], entryCount: null })   // the summary is a nicety — never block closing
    }
  }

  // step 2: one call closes the season with everything you wrote
  const handleClose = async () => {
    setClosing(true)
    setError('')
    try {
      await axios.post(`/api/seasons/${season.id}/close`, { reflection, carryForward, released })
      setStep('closed')
    } catch {
      setError('Something went wrong.')
    } finally {
      setClosing(false)
    }
  }

  const handleStartNew = async () => {
    if (!form.name.trim()) return setError('Give your new season a name.')
    setSaving(true)
    setError('')
    try {
      const res = await axios.post('/api/seasons', form)
      onSave(res.data.season)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleEndWithoutNew = () => {
    onSave(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 modal-backdrop" style={{ background: 'rgba(45, 42, 53, 0.4)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl modal-sheet max-h-[90vh] overflow-y-auto">

        {/* ── CEREMONY ── */}
        {step === 'ceremony' && (
          <>
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">{season?.emoji || '✦'}</p>
              <h2 className="text-base font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                closing {season?.name}
              </h2>
              <p className="text-xs text-[#a89bc2]">take a moment to look back before it ends</p>
              <p className="text-[11px] text-[#c4b8d9] mt-1">everything here is optional</p>
            </div>

            {/* what grew */}
            <div className="rounded-xl border border-[#ede9f5] bg-[#faf8ff] px-4 py-3 mb-5">
              <p className="text-xs text-[#a89bc2] mb-2">
                {summary ? `${summary.days} ${summary.days === 1 ? 'day' : 'days'}` : ''}
                {summary?.entryCount != null && ` · ${summary.entryCount >= 200 ? '200+' : summary.entryCount} journal ${summary.entryCount === 1 ? 'entry' : 'entries'}`}
              </p>
              {summary?.seeds?.length > 0 ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {summary.seeds.map(s => (
                    <span key={s.id} className="text-xs text-[#7c6f9b]" title={stageFor(s.actionCount).name}>
                      <span className="text-lg mr-1 align-middle">{stageFor(s.actionCount).emoji}</span>
                      {s.title}{!isActive(s) && ' (replanted)'}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#c4b8d9] italic">{summary ? 'no seeds this season — that\'s okay' : '…'}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">what do you want to remember about this season?</p>
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed"
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">what are you carrying forward?</p>
              <textarea
                value={carryForward}
                onChange={e => setCarryForward(e.target.value)}
                rows={2}
                placeholder="habits, people, lessons worth keeping…"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed"
              />
            </div>

            <div className="mb-5">
              <p className="text-xs text-[#a89bc2] mb-1.5">what are you ready to let go of?</p>
              <textarea
                value={released}
                onChange={e => setReleased(e.target.value)}
                rows={2}
                placeholder="what you're setting down, with thanks…"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed"
              />
            </div>

            {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleClose}
                disabled={closing}
                className="w-full py-2.5 rounded-xl text-white text-xs font-medium transition-opacity disabled:opacity-50"
                style={{ background: form.color }}
              >
                {closing ? 'closing...' : 'close this season'}
              </button>
              <button onClick={() => setStep('edit')} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors text-center py-1">
                not yet
              </button>
            </div>
          </>
        )}

        {/* ── CLOSED STATE ── */}
        {step === 'closed' && (
          <>
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">{season?.emoji || '✦'}</p>
              <h2 className="text-base font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {season?.name} has ended
              </h2>
              <p className="text-xs text-[#a89bc2]">ready to begin something new?</p>
            </div>

            {/* new season form */}
            <TemplatePicker onPick={pickTemplate} />

            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-2">emoji</p>
              <EmojiPicker value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e }))} />
            </div>

            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">new season name</p>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. summer of building"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">intention <span className="text-[#d4cfe3]">(optional)</span></p>
              <input
                value={form.intention}
                onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                placeholder="what does this season want from you?"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
              />
            </div>

            <div className="mb-5">
              <p className="text-xs text-[#a89bc2] mb-2">color</p>
              <div className="flex gap-2.5">
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartNew}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-white text-xs font-medium transition-opacity disabled:opacity-50"
                style={{ background: form.color }}
              >
                {saving ? 'starting...' : 'begin new season'}
              </button>
              <button onClick={handleEndWithoutNew} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors text-center py-1">
                not yet
              </button>
            </div>
          </>
        )}

        {/* ── EDIT STATE ── */}
        {step === 'edit' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
                {isNew ? 'start a new season' : 'your season'}
              </h2>
              <button onClick={onClose} className="text-[#c4b8d9] hover:text-[#a89bc2] text-lg leading-none">✕</button>
            </div>

            {isNew && <TemplatePicker onPick={pickTemplate} />}

            {/* emoji */}
            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-2">emoji</p>
              <EmojiPicker value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e }))} />
            </div>

            {/* name */}
            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">season name</p>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. summer of building"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
              />
            </div>

            {/* intention */}
            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">intention <span className="text-[#d4cfe3]">(optional)</span></p>
              <input
                value={form.intention}
                onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                placeholder="what does this season want from you?"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
              />
            </div>

            {/* color */}
            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-2">color</p>
              <div className="flex gap-2.5">
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>

            {/* cover photo */}
            <div className="mb-4">
              <p className="text-xs text-[#a89bc2] mb-1.5">cover photo <span className="text-[#d4cfe3]">(optional)</span></p>
              {form.coverUrl && (
                <div className="relative mb-2 rounded-xl overflow-hidden h-28">
                  <img src={form.coverUrl} alt="cover" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  <button onClick={() => setForm(f => ({ ...f, coverUrl: '' }))} className="absolute top-1.5 right-1.5 bg-black/40 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/60">✕</button>
                </div>
              )}
              <input
                value={form.coverUrl}
                onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}
                placeholder="paste an image URL..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#2d2a35] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2]"
              />
            </div>

            {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

            <div className="flex gap-2">
              {!isNew && (
                <button
                  onClick={beginCeremony}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4dff0] text-xs text-[#a89bc2] hover:text-[#7c6f9b] transition-colors"
                >
                  end this season
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-medium transition-opacity disabled:opacity-50"
                style={{ background: form.color }}
              >
                {saving ? 'saving...' : isNew ? 'begin season' : 'save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
