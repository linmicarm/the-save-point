import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'

// ── constants ─────────────────────────────────────────────────────
const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     label: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🌙' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍎' },
  { key: 'drinks',    label: 'Drinks',    emoji: '🧋' },
  { key: 'desserts',  label: 'Desserts',  emoji: '🍰' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SHOP_CATS = [
  { key: 'produce',  label: 'Produce',     emoji: '🥬' },
  { key: 'dairy',    label: 'Dairy',       emoji: '🥛' },
  { key: 'meat',     label: 'Meat & Fish', emoji: '🥩' },
  { key: 'pantry',   label: 'Pantry',      emoji: '🥫' },
  { key: 'bakery',   label: 'Bakery',      emoji: '🍞' },
  { key: 'frozen',   label: 'Frozen',      emoji: '🧊' },
  { key: 'drinks',   label: 'Drinks',      emoji: '🧃' },
  { key: 'other',    label: 'Other',       emoji: '🛒' },
]

const TAG_PALETTE = [
  { bg: '#f0e6ff', text: '#7c5cbf' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fef9c3', text: '#854d0e' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#e0f2fe', text: '#0369a1' },
  { bg: '#f1f5f9', text: '#475569' },
]
function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

// ── week helpers ──────────────────────────────────────────────────
function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function toISO(date) { return date.toISOString().split('T')[0] }
function fmt(date, opts) { return new Date(date).toLocaleDateString('en-US', opts) }

// ── sub-components ────────────────────────────────────────────────
function StarRating({ value, onChange, size = 'sm' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          className={`${sz} transition-colors`}
          style={{ color: n <= (hover || value || 0) ? '#f59e0b' : '#e4dff0' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? null : n)}
        >★</button>
      ))}
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map(t => {
        const c = tagColor(t)
        return (
          <span key={t} className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: c.bg, color: c.text }}>
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} className="ml-0.5 hover:opacity-60">×</button>
          </span>
        )
      })}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder="add tag…"
        className="text-[11px] text-[#5a5065] bg-transparent focus:outline-none placeholder-[#d4cfe3] min-w-[60px] flex-1"
      />
    </div>
  )
}

function MealCard({ entry, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="group relative bg-white border border-[#e4dff0] rounded-xl px-3 py-2 hover:border-[#c4b5fd] transition-colors">
      <div className="flex items-start justify-between gap-1">
        <button onClick={() => setExpanded(v => !v)} className="text-[12px] font-medium text-[#2d2a35] text-left leading-snug flex-1 hover:text-[#7c6f9b] transition-colors">
          {entry.name}
        </button>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="secondary" size="sm" onClick={() => onEdit(entry)}>edit</Button>
          <button onClick={() => onDelete(entry.id)} className="text-[10px] text-[#c4b8d9] hover:text-rose-400">✕</button>
        </div>
      </div>
      {entry.rating > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {[1,2,3,4,5].map(n => (
            <span key={n} className="text-[10px]" style={{ color: n <= entry.rating ? '#f59e0b' : '#e4dff0' }}>★</span>
          ))}
        </div>
      )}
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {entry.tags.map(t => {
            const c = tagColor(t)
            return <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.text }}>{t}</span>
          })}
        </div>
      )}
      {expanded && entry.notes && (
        <p className="text-[11px] text-[#7c6f9b] mt-1.5 leading-relaxed border-t border-[#f0ebff] pt-1.5">{entry.notes}</p>
      )}
    </div>
  )
}

function MealForm({ initial, onSave, onCancel }) {
  const [name, setName]     = useState(initial?.name || '')
  const [notes, setNotes]   = useState(initial?.notes || '')
  const [rating, setRating] = useState(initial?.rating || null)
  const [tags, setTags]     = useState(initial?.tags || [])
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), notes: notes.trim(), rating, tags })
  }

  return (
    <form onSubmit={submit} className="bg-[#faf8ff] border border-[#c4b5fd]/40 rounded-xl p-3 space-y-2.5 mt-1">
      <input ref={ref} value={name} onChange={e => setName(e.target.value)}
        placeholder="meal name…"
        className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#d4cfe3] border-b border-[#e4dff0] pb-1"
      />
      <StarRating value={rating} onChange={setRating} />
      <TagInput tags={tags} onChange={setTags} />
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="notes, recipe link…"
        rows={2}
        className="w-full text-[11px] text-[#5a5065] bg-transparent focus:outline-none placeholder-[#d4cfe3] resize-none leading-relaxed"
      />
      <div className="flex gap-2 pt-0.5">
        <button type="submit" disabled={!name.trim()}
          className="text-[11px] px-3 py-1 rounded-full text-white disabled:opacity-40 bg-[#c4b5fd]">
          {initial ? 'update' : 'add'}
        </button>
        <Button variant="quiet" type="button" onClick={onCancel}>cancel</Button>
      </div>
    </form>
  )
}

function ShoppingList({ items, onAdd, onToggle, onDelete }) {
  const [newName, setNewName]     = useState('')
  const [newCat, setNewCat]       = useState('')
  const [newQty, setNewQty]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [showDone, setShowDone]   = useState(false)

  const grouped = SHOP_CATS.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat.key && (showDone || !i.checked))
    if (catItems.length) acc.push({ ...cat, items: catItems })
    return acc
  }, [])
  const uncategorised = items.filter(i => !i.category && (showDone || !i.checked))
  if (uncategorised.length) grouped.push({ key: 'other', label: 'Other', emoji: '🛒', items: uncategorised })

  const checkedCount = items.filter(i => i.checked).length
  const totalCount   = items.length

  const submit = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onAdd({ name: newName.trim(), category: newCat || null, quantity: newQty.trim() || null })
    setNewName(''); setNewCat(''); setNewQty(''); setShowForm(false)
  }

  return (
    <div className="bg-white border border-[#e4dff0] rounded-2xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4dff0]">
        <div className="flex items-center gap-2">
          <span className="text-sm">🛒</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a89bc2]">shopping list</p>
          {totalCount > 0 && (
            <span className="text-[10px] text-[#c4b8d9]">{checkedCount}/{totalCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <button onClick={() => setShowDone(v => !v)} className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors">
              {showDone ? 'hide done' : `show ${checkedCount} done`}
            </button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowForm(v => !v)}>+ add</Button>
        </div>
      </div>

      {/* add form */}
      {showForm && (
        <form onSubmit={submit} className="px-4 py-3 border-b border-[#e4dff0] space-y-2 bg-[#faf8ff]">
          <div className="flex gap-2">
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="item name…"
              className="flex-1 text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#d4cfe3] border-b border-[#e4dff0] pb-1"
            />
            <input value={newQty} onChange={e => setNewQty(e.target.value)}
              placeholder="qty"
              className="w-16 text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#d4cfe3] border-b border-[#e4dff0] pb-1"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SHOP_CATS.map(c => (
              <button key={c.key} type="button"
                onClick={() => setNewCat(v => v === c.key ? '' : c.key)}
                className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                style={newCat === c.key
                  ? { background: '#f0ebff', color: 'var(--sp-text-muted)', borderColor: '#c4b5fd' }
                  : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
              >{c.emoji} {c.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="submit" disabled={!newName.trim()}>add</Button>
            <Button variant="quiet" type="button" onClick={() => setShowForm(false)}>cancel</Button>
          </div>
        </form>
      )}

      {/* list */}
      <div className="px-4 py-3 space-y-4">
        {grouped.length === 0 && !showForm && (
          <p className="text-xs text-[#c4b8d9] text-center py-4">no items yet</p>
        )}
        {grouped.map(cat => (
          <div key={cat.key}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#c4b8d9] mb-2">{cat.emoji} {cat.label}</p>
            <div className="space-y-1.5">
              {cat.items.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 group">
                  <button onClick={() => onToggle(item.id, !item.checked)}
                    className="w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors"
                    style={item.checked
                      ? { background: '#c4b5fd', borderColor: '#c4b5fd' }
                      : { borderColor: 'var(--sp-border)' }}>
                    {item.checked && <span className="text-white text-[9px]">✓</span>}
                  </button>
                  <span className={`text-sm flex-1 ${item.checked ? 'line-through text-[#c4b8d9]' : 'text-[#3d3545]'}`}>
                    {item.name}
                    {item.quantity && <span className="text-[#c4b8d9] ml-1.5 text-xs">{item.quantity}</span>}
                  </span>
                  <button onClick={() => onDelete(item.id)}
                    className="text-[10px] text-[#c4b8d9] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────
export default function MealPlanPage() {
  const { showToast } = useToast()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [entries, setEntries]     = useState([])
  const [shopItems, setShopItems] = useState([])
  const [, setLoading]             = useState(true)
  const [adding, setAdding]       = useState(null)  // { day, mealType }
  const [editing, setEditing]     = useState(null)  // entry

  const load = (ws) => {
    setLoading(true)
    axios.get(`/api/meals?weekStart=${toISO(ws)}`)
      .then(res => { setEntries(res.data.entries); setShopItems(res.data.shopItems) })
      .catch(() => showToast('could not load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(weekStart) }, [toISO(weekStart)])

  const prevWeek = () => setWeekStart(d => addDays(d, -7))
  const nextWeek = () => setWeekStart(d => addDays(d,  7))
  const goToday  = () => setWeekStart(getMondayOf(new Date()))

  const addEntry = async (day, mealType, data) => {
    try {
      const res = await axios.post('/api/meals/entries', { weekStart: toISO(weekStart), day, mealType, ...data })
      setEntries(es => [...es, res.data.entry])
      setAdding(null)
    } catch { showToast('could not add meal') }
  }

  const updateEntry = async (id, data) => {
    try {
      const res = await axios.patch(`/api/meals/entries/${id}`, data)
      setEntries(es => es.map(e => e.id === id ? res.data.entry : e))
      setEditing(null)
    } catch { showToast('could not update') }
  }

  const deleteEntry = async (id) => {
    try {
      await axios.delete(`/api/meals/entries/${id}`)
      setEntries(es => es.filter(e => e.id !== id))
    } catch { showToast('could not delete') }
  }

  const addShopItem = async (data) => {
    try {
      const res = await axios.post('/api/meals/shop', { weekStart: toISO(weekStart), ...data })
      setShopItems(is => [...is, res.data.item])
    } catch { showToast('could not add item') }
  }

  const toggleShopItem = async (id, checked) => {
    setShopItems(is => is.map(i => i.id === id ? { ...i, checked } : i))
    try {
      await axios.patch(`/api/meals/shop/${id}`, { checked })
    } catch {
      setShopItems(is => is.map(i => i.id === id ? { ...i, checked: !checked } : i))
    }
  }

  const deleteShopItem = async (id) => {
    try {
      await axios.delete(`/api/meals/shop/${id}`)
      setShopItems(is => is.filter(i => i.id !== id))
    } catch { showToast('could not delete') }
  }

  const isThisWeek = toISO(getMondayOf(new Date())) === toISO(weekStart)

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>meal plan</h1>
            <p className="text-xs text-[#a89bc2] mt-0.5">
              {fmt(weekStart, { month: 'long', day: 'numeric' })} — {fmt(addDays(weekStart, 6), { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isThisWeek && (
              <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] transition-colors">
                this week
              </button>
            )}
            <button onClick={prevWeek} className="w-8 h-8 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] transition-colors flex items-center justify-center text-sm">‹</button>
            <button onClick={nextWeek} className="w-8 h-8 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] transition-colors flex items-center justify-center text-sm">›</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* ── meal grid ── */}
          <div className="flex-1 min-w-0 space-y-3">
            {DAYS.map((dayLabel, dayIdx) => {
              const date = addDays(weekStart, dayIdx)
              const isToday = toISO(date) === toISO(new Date())
              return (
                <div key={dayIdx} className="bg-white border border-[#e4dff0] rounded-2xl overflow-hidden">
                  {/* day header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0ebff]"
                    style={{ background: isToday ? 'rgba(196,181,253,0.08)' : undefined }}>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-medium" style={{ color: isToday ? '#7c6f9b' : '#2d2a35' }}>{dayLabel}</p>
                      <p className="text-xs text-[#c4b8d9]">{fmt(date, { month: 'short', day: 'numeric' })}</p>
                    </div>
                    {isToday && <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f0ebff] text-[#7c6f9b]">today</span>}
                  </div>

                  {/* meal type columns */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-[#f0ebff]">
                    {MEAL_TYPES.map(({ key, label, emoji }) => {
                      const cellEntries = entries.filter(e => e.day === dayIdx && e.mealType === key)
                      const isAddingHere = adding?.day === dayIdx && adding?.mealType === key
                      const _editingEntry = editing && entries.find(e => e.id === editing.id && e.day === dayIdx && e.mealType === key)

                      return (
                        <div key={key} className="p-3 min-h-[80px]">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#c4b8d9] mb-2">
                            {emoji} {label}
                          </p>
                          <div className="space-y-1.5">
                            {cellEntries.map(entry =>
                              editing?.id === entry.id ? (
                                <MealForm key={entry.id} initial={entry}
                                  onSave={data => updateEntry(entry.id, data)}
                                  onCancel={() => setEditing(null)} />
                              ) : (
                                <MealCard key={entry.id} entry={entry}
                                  onDelete={deleteEntry}
                                  onEdit={e => setEditing(e)} />
                              )
                            )}
                          </div>
                          {isAddingHere ? (
                            <MealForm
                              onSave={data => addEntry(dayIdx, key, data)}
                              onCancel={() => setAdding(null)} />
                          ) : (
                            <Button variant="secondary" size="sm" className="mt-1.5" onClick={() => { setAdding({ day: dayIdx, mealType: key }); setEditing(null) }}>+ add</Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── shopping list ── */}
          <div className="w-full xl:w-72 shrink-0 xl:sticky xl:top-8">
            <ShoppingList
              items={shopItems}
              weekStart={weekStart}
              onAdd={addShopItem}
              onToggle={toggleShopItem}
              onDelete={deleteShopItem}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
