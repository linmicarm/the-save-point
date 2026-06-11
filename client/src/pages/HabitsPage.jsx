import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import SeasonBadge from '../components/SeasonBadge'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

const ACCENT_PRESETS = [
  '#c4b5fd', '#f9a8d4', '#86efac', '#93c5fd', '#fdba74',
  '#fde68a', '#a5f3fc', '#d4b896', '#fb7185', '#a3e635',
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function WeekDots({ logs, color }) {
  const days = getLast7Days()
  const logSet = new Set((logs || []).map(l => l.date?.split('T')[0] || l.date))
  return (
    <div className="flex gap-1.5 mt-2">
      {days.map((d) => {
        const filled = logSet.has(d)
        const isToday = d === todayISO()
        return (
          <div key={d} className="flex flex-col items-center gap-0.5">
            <div
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{
                background: filled ? color : 'transparent',
                border: `1.5px solid ${filled ? color : '#e4dff0'}`,
                boxShadow: isToday ? `0 0 0 1.5px ${color}55` : undefined,
              }}
            />
            <span className="text-[8px] text-[#d4cfe3]">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'][(new Date(d + 'T12:00:00').getDay())]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HabitCard({ habit, accent, onLog, onArchive }) {
  const color = habit.color || accent
  const colorRgb = hexToRgb(color)
  const today = todayISO()
  const todayLog = habit.todayLog || (habit.logs || []).find(l => (l.date?.split('T')[0] || l.date) === today)
  const [logging, setLogging] = useState(false)

  const handleLog = async (value) => {
    if (logging) return
    setLogging(true)
    try {
      await onLog(habit.id, value)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div
      className="bg-white border rounded-2xl p-4 transition-shadow hover:shadow-sm"
      style={{ borderColor: `rgba(${colorRgb}, 0.2)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `rgba(${colorRgb}, 0.12)` }}
          >
            {habit.emoji || '✦'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#2d2a35] truncate">{habit.name}</p>
            {(habit.streak || 0) > 0 && (
              <p className="text-[10px] text-[#a89bc2] mt-0.5">🔥 {habit.streak} day streak</p>
            )}
            {habit.season && (
              <div className="mt-1">
                <SeasonBadge season={habit.season} />
              </div>
            )}
          </div>
        </div>

        {/* log button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {todayLog ? (
            <div
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium"
              style={{ background: `rgba(${colorRgb}, 0.12)`, color }}
            >
              <span>✓</span>
              <span>done</span>
            </div>
          ) : (
            <button
              onClick={() => handleLog(1)}
              disabled={logging}
              className="text-[11px] px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40"
              style={{ borderColor: `rgba(${colorRgb}, 0.4)`, color }}
            >
              {logging ? '…' : '✓ log'}
            </button>
          )}
          <button
            onClick={() => onArchive(habit.id)}
            className="text-[10px] text-[#d4cfe3] hover:text-rose-400 transition-colors px-1"
            title="archive habit"
          >
            ×
          </button>
        </div>
      </div>

      <WeekDots logs={habit.logs || []} color={color} />
    </div>
  )
}

function AddHabitForm({ accent, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [color, setColor] = useState(accent)
  const [saving, setSaving] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onAdd({ name: name.trim(), emoji: emoji.trim() || null, color })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-[#e4dff0] rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
          new habit
        </p>
        <button type="button" onClick={onCancel} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
      </div>

      <div className="flex gap-3">
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="✦"
          maxLength={2}
          className="w-12 text-center text-xl bg-[#faf8ff] border border-[#e4dff0] rounded-xl py-2 focus:outline-none focus:border-[#a89bc2]"
        />
        <input
          ref={nameRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="habit name…"
          className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      </div>

      <div>
        <p className="text-[10px] text-[#a89bc2] uppercase tracking-wider mb-2">color</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform"
              style={{
                background: c,
                transform: color === c ? 'scale(1.25)' : 'scale(1)',
                boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b]">cancel</button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="text-xs px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-colors"
          style={{ background: color }}
        >
          {saving ? 'adding…' : 'add habit'}
        </button>
      </div>
    </form>
  )
}

export default function HabitsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeSeason, setActiveSeason] = useState(null)

  const accent = user?.accentColor || '#c4b5fd'

  const loadHabits = () => {
    setLoading(true)
    axios.get('/api/habits')
      .then(res => setHabits(res.data.habits || res.data || []))
      .catch(() => setHabits([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHabits()
    axios.get('/api/seasons/active')
      .then(r => setActiveSeason(r.data.season || null))
      .catch(() => {})
  }, [])

  const handleLog = async (habitId, value) => {
    try {
      const res = await axios.post(`/api/habits/${habitId}/log`, { date: todayISO(), value })
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h
        const updatedHabit = res.data.habit || { ...h, todayLog: res.data.log || { date: todayISO(), value } }
        return updatedHabit
      }))
      showToast('logged!', 'success')
    } catch {
      showToast('could not log habit', 'error')
      throw new Error('failed')
    }
  }

  const handleAdd = async (data) => {
    try {
      const res = await axios.post('/api/habits', { ...data, seasonId: activeSeason?.id || null })
      setHabits(prev => [res.data.habit || res.data, ...prev])
      setShowAddForm(false)
      showToast('habit added', 'success')
    } catch {
      showToast('could not add habit', 'error')
      throw new Error('failed')
    }
  }

  const handleArchive = async (habitId) => {
    try {
      await axios.patch(`/api/habits/${habitId}`, { archived: true })
      setHabits(prev => prev.filter(h => h.id !== habitId))
      showToast('habit archived', 'success')
    } catch {
      showToast('could not archive habit', 'error')
    }
  }

  const _accentRgb = hexToRgb(accent)

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-medium text-[#2d2a35]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              habits
            </h1>
            <p className="text-sm text-[#a89bc2] mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-xs px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            + new habit
          </button>
        </div>

        {/* add form */}
        {showAddForm && (
          <div className="mb-6">
            <AddHabitForm
              accent={accent}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : habits.length === 0 && !showAddForm ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🌱</p>
            <p className="text-sm text-[#a89bc2] mb-6">start tracking your first habit</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              add a habit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.filter(h => !h.archived).map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                accent={accent}
                onLog={handleLog}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
