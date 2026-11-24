import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  DndContext, closestCenter,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBLE } from '../utils/sections'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

// ─────────────────────────────────────────────
//  Section metadata
// ─────────────────────────────────────────────

const SECTION_META = {
  currently:   { label: 'Currently',           emoji: '✨', hint: 'what you\'re watching, reading, playing…'    },
  journal:     { label: 'Recent journal',       emoji: '📓', hint: 'last 3 public journal entries'               },
  mood:        { label: 'Mood arc',             emoji: '🌤', hint: 'emotional sparkline for this season'          },
  shelf:       { label: 'Season shelf',         emoji: '📚', hint: 'media you\'re consuming this season'          },
  now:         { label: 'Now',                  emoji: '🧭', hint: 'your /now page — focus, building, feeling'    },
  onthisday:   { label: 'On this day',          emoji: '📅', hint: 'milestones from this date in past years'      },
  commonplace: { label: 'Commonplace',          emoji: '💬', hint: 'a quote from your commonplace book'           },
  blog:        { label: 'Blog',                 emoji: '✍️',  hint: 'your 3 most recent public posts'              },
  updates:     { label: 'Updates',              emoji: '🫧',  hint: 'your short-form updates feed'                 },
  milestones:  { label: 'Milestones',           emoji: '🏔',  hint: 'public life milestones'                       },
  places:      { label: 'Places',               emoji: '📍', hint: 'lived, visited, want to go'                   },
}

// ─────────────────────────────────────────────
//  Shared UI
// ─────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#a89bc2] shrink-0">{children}</h2>
      <div className="flex-1 h-px bg-[#e4dff0]" />
    </div>
  )
}

// ─────────────────────────────────────────────
//  Account tab components
// ─────────────────────────────────────────────

function ChangePasswordForm() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirmPassword) { setError('new passwords do not match'); return }
    if (form.newPassword.length < 8) { setError('new password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await axios.patch('/api/users/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      showToast('password updated')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'something went wrong')
    } finally { setSaving(false) }
  }

  const inputClass = 'w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] transition-colors'
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="password" placeholder="current password" value={form.currentPassword}
        onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
        className={inputClass} autoComplete="current-password" />
      <input type="password" placeholder="new password" value={form.newPassword}
        onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
        className={inputClass} autoComplete="new-password" />
      <input type="password" placeholder="confirm new password" value={form.confirmPassword}
        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
        className={inputClass} autoComplete="new-password" />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex justify-end pt-1">
        <button type="submit"
          disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          className="text-xs px-4 py-2 rounded-xl bg-[#c4b5fd] text-white hover:bg-[#b39ef7] disabled:opacity-50 transition-colors">
          {saving ? 'updating...' : 'update password'}
        </button>
      </div>
    </form>
  )
}

function DeleteAccountSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword]     = useState('')
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState('')

  const handleDelete = async () => {
    if (!password) return
    setError('')
    setDeleting(true)
    try {
      await axios.delete('/api/users/account', { data: { password } })
      logout()
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'incorrect password or something went wrong')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}
        className="text-xs px-4 py-2 rounded-xl border border-rose-200 text-rose-400 hover:bg-rose-50 hover:border-rose-300 transition-colors">
        delete account
      </button>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-rose-400 leading-relaxed">
        this will permanently delete all your data including journal entries, blog posts, photos, and everything else. this cannot be undone.
      </p>
      <input type="password" placeholder="enter your password to confirm" value={password}
        onChange={e => { setPassword(e.target.value); setError('') }}
        className="w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-rose-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-300 placeholder-[#c4b8d9] transition-colors"
        autoComplete="current-password" />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex items-center gap-3">
        <Button variant="quiet" onClick={() => { setConfirming(false); setPassword(''); setError('') }}>cancel</Button>
        <button onClick={handleDelete} disabled={deleting || !password}
          className="text-xs px-4 py-2 rounded-xl bg-rose-400 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors">
          {deleting ? 'deleting...' : 'permanently delete'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  My Page tab — drag-to-reorder section list
// ─────────────────────────────────────────────

function SortableRow({ id, visible, onToggle }) {
  const meta = SECTION_META[id] || { label: id, emoji: '✦', hint: '' }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.7 : 1,
      }}
      className="flex items-center gap-3 bg-white border border-[#e4dff0] rounded-2xl px-4 py-3 mb-2 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#d4cfe3] hover:text-[#a89bc2] transition-colors text-base leading-none select-none touch-none shrink-0"
        aria-label="drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>

      {/* Emoji */}
      <span className="text-base shrink-0 leading-none">{meta.emoji}</span>

      {/* Label + hint */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2d2a35]">{meta.label}</p>
        {meta.hint && (
          <p className="text-[10px] text-[#c4b8d9] mt-0.5 truncate">{meta.hint}</p>
        )}
      </div>

      {/* Visibility toggle */}
      <button
        onClick={onToggle}
        className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all"
        style={visible
          ? { background: '#c4b5fd1a', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd55' }
          : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
      >
        {visible ? 'visible' : 'hidden'}
      </button>
    </div>
  )
}

function MyPageSettings() {
  const { showToast } = useToast()
  const [order,   setOrder]   = useState(DEFAULT_SECTION_ORDER)
  const [visible, setVisible] = useState(DEFAULT_SECTION_VISIBLE)
  const [loaded,  setLoaded]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const saveTimer = useRef(null)

  // Load settings on mount
  useEffect(() => {
    axios.get('/api/users/page-settings')
      .then(r => {
        setOrder(r.data.sectionsOrder   ?? DEFAULT_SECTION_ORDER)
        setVisible(r.data.sectionsVisible ?? DEFAULT_SECTION_VISIBLE)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Auto-save helper (debounced 600ms)
  const persist = (newOrder, newVisible) => {
    clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await axios.patch('/api/users/page-settings', {
          sectionsOrder:   newOrder,
          sectionsVisible: newVisible,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch { showToast('could not save — try again') }
      finally { setSaving(false) }
    }, 600)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id)
    const newIndex = order.indexOf(over.id)
    const newOrder = arrayMove(order, oldIndex, newIndex)
    setOrder(newOrder)
    persist(newOrder, visible)
  }

  const toggleVisible = key => {
    const newVisible = { ...visible, [key]: !visible[key] }
    setVisible(newVisible)
    persist(order, newVisible)
  }

  const resetToDefaults = () => {
    setOrder(DEFAULT_SECTION_ORDER)
    setVisible(DEFAULT_SECTION_VISIBLE)
    persist(DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBLE)
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#c4b8d9]">loading…</p>
      </div>
    )
  }

  const visibleCount = order.filter(k => visible[k] !== false).length

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-medium text-[#2d2a35]">page sections</p>
          <p className="text-[11px] text-[#a89bc2] mt-0.5">
            drag to reorder · {visibleCount} of {order.length} visible
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-[10px] text-[#c4b8d9]">saving…</span>
          )}
          {saved && !saving && (
            <span className="text-[10px] text-[#86efac]">✓ saved</span>
          )}
          <Button variant="secondary" size="sm" onClick={resetToDefaults}>reset defaults</Button>
        </div>
      </div>

      {/* Drag list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map(key => (
            <SortableRow
              key={key}
              id={key}
              visible={visible[key] !== false}
              onToggle={() => toggleVisible(key)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Footer note */}
      <p className="text-[11px] text-[#c4b8d9] mt-4 leading-relaxed">
        hidden sections disappear from your public page. visitors will see your page in this exact order.
        the "about" section always appears at the bottom.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Main Settings Page
// ─────────────────────────────────────────────

const TABS = [
  { key: 'account',  label: 'account' },
  { key: 'mypage',   label: 'my page' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('account')

  const exportData = async () => {
    try {
      const res = await axios.get('/api/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'savepoint-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Export failed', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <div className="max-w-2xl mx-auto px-5 py-8 pt-2">

        <div className="mb-8">
          <BackLink to={`/u/${user?.username}`}
            className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </BackLink>
        </div>

        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
          settings
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">manage your account and public page</p>

        {/* Tab strip */}
        <div className="flex gap-1 mb-8 bg-[#f0ecfb] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
              style={activeTab === t.key
                ? { background: 'var(--sp-surface)', color: 'var(--sp-text-muted)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { color: 'var(--sp-text-faint)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Account tab ── */}
        {activeTab === 'account' && (
          <>
            <div className="mb-10">
              <SectionHeading>profile</SectionHeading>
              <Link to={`/u/${user?.username}`}
                className="flex items-center justify-between bg-white border border-[#e4dff0] rounded-2xl px-5 py-4 hover:border-[#c4b8d9] transition-colors group">
                <div>
                  <p className="text-sm font-medium text-[#2d2a35]">edit profile</p>
                  <p className="text-xs text-[#a89bc2] mt-0.5">update your bio, avatar, and accent color</p>
                </div>
                <span className="text-[#c4b8d9] group-hover:text-[#a89bc2] transition-colors text-sm">→</span>
              </Link>
            </div>

            <div className="mb-10">
              <SectionHeading>security</SectionHeading>
              <div className="bg-white border border-[#e4dff0] rounded-2xl px-5 py-5">
                <p className="text-sm font-medium text-[#2d2a35] mb-4">change password</p>
                <ChangePasswordForm />
              </div>
            </div>

            <div className="mb-10">
              <SectionHeading>your data</SectionHeading>
              <div className="bg-white border border-[#e4dff0] rounded-2xl px-5 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#2d2a35]">download everything</p>
                  <p className="text-xs text-[#a89bc2] mt-0.5">your journal, photos, letters and more, in one file you keep.</p>
                </div>
                <Button size="sm" onClick={exportData} className="shrink-0">export</Button>
              </div>
            </div>

            <div className="mb-10">
              <SectionHeading>danger zone</SectionHeading>
              <div className="bg-white border border-rose-100 rounded-2xl px-5 py-5"
                style={{ background: 'rgba(255,241,242,0.5)' }}>
                <p className="text-sm font-medium text-rose-400 mb-1">delete account</p>
                <p className="text-xs text-[#a89bc2] mb-4">once deleted, your account cannot be recovered</p>
                <DeleteAccountSection />
              </div>
            </div>
          </>
        )}

        {/* ── My Page tab ── */}
        {activeTab === 'mypage' && (
          <div className="bg-white border border-[#e4dff0] rounded-2xl px-5 py-5">
            <MyPageSettings />
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-4">✦ the save point</p>
      </div>
    </div>
  )
}
