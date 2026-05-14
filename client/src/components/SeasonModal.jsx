import { useState } from 'react'
import axios from 'axios'
import EmojiPicker from './EmojiPicker'

const COLOR_PRESETS = [
  '#c4b5fd', '#fda4af', '#86efac',
  '#fdba74', '#93c5fd', '#d4b896',
]

export default function SeasonModal({ season, onClose, onSave }) {
  const isNew = !season

  // 'edit' | 'closed' | 'new'
  const [step, setStep] = useState('edit')

  const [form, setForm] = useState({
    name:      season?.name      || '',
    emoji:     season?.emoji     || '✦',
    color:     season?.color     || '#c4b5fd',
    intention: season?.intention || '',
    coverUrl:  season?.coverUrl  || '',
  })
  const [reflection, setReflection] = useState('')
  const [saving, setSaving]   = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError]     = useState('')

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

  const handleClose = async () => {
    setClosing(true)
    setError('')
    try {
      // save reflection then close
      if (reflection.trim()) {
        await axios.patch(`/api/seasons/${season.id}`, { reflection })
      }
      await axios.post(`/api/seasons/${season.id}/close`)
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

            {/* reflection — only on active (non-new) seasons so you can jot closing thoughts */}
            {!isNew && (
              <div className="mb-5">
                <p className="text-xs text-[#a89bc2] mb-1.5">closing reflection <span className="text-[#d4cfe3]">(optional)</span></p>
                <textarea
                  value={reflection}
                  onChange={e => setReflection(e.target.value)}
                  placeholder="anything you want to remember about this season before it ends..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e4dff0] bg-[#faf8ff] text-sm text-[#5a5065] placeholder-[#c4b8d9] focus:outline-none focus:border-[#a89bc2] resize-none leading-relaxed"
                />
              </div>
            )}

            {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

            <div className="flex gap-2">
              {!isNew && (
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4dff0] text-xs text-[#a89bc2] hover:text-[#7c6f9b] transition-colors disabled:opacity-50"
                >
                  {closing ? 'closing...' : 'end this season'}
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
