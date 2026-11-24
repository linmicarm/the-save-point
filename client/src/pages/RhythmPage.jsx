import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Button from '../components/Button'

const PRESET_GROUPS = [
  {
    label: 'Days',
    presets: [
      { label: 'Monday',    emoji: '🌱' },
      { label: 'Tuesday',   emoji: '🌱' },
      { label: 'Wednesday', emoji: '🌱' },
      { label: 'Thursday',  emoji: '🌱' },
      { label: 'Friday',    emoji: '🌿' },
      { label: 'Saturday',  emoji: '🌿' },
      { label: 'Sunday',    emoji: '☀️' },
      { label: 'Weekdays',  emoji: '💼' },
      { label: 'Weekends',  emoji: '🛋️' },
    ],
  },
  {
    label: 'Times of day',
    presets: [
      { label: 'Morning routine',  emoji: '🌅' },
      { label: 'Evening routine',  emoji: '🌙' },
      { label: 'Slow mornings',    emoji: '☕' },
      { label: 'Night wind-down',  emoji: '🕯️' },
      { label: 'Lunch break',      emoji: '🍱' },
    ],
  },
  {
    label: 'Themes',
    presets: [
      { label: 'Deep work',        emoji: '🔇' },
      { label: 'Creative time',    emoji: '🎨' },
      { label: 'Movement',         emoji: '🏃' },
      { label: 'Rest & recovery',  emoji: '💤' },
      { label: 'Social time',      emoji: '🫂' },
      { label: 'Learning',         emoji: '📖' },
      { label: 'Admin & errands',  emoji: '📋' },
      { label: 'Self-care',        emoji: '🌸' },
    ],
  },
]

export default function RhythmPage() {
  const { user } = useAuth()

  const [blocks, setBlocks]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [showPicker, setShowPicker]   = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [layout, setLayout]           = useState(() => localStorage.getItem('rhythm_layout') || 'list')

  useEffect(() => {
    axios.get('/api/rhythm')
      .then(res => setBlocks(res.data.blocks))
      .finally(() => setLoading(false))
  }, [])

  const addBlock = async (label) => {
    try {
      const res = await axios.post('/api/rhythm', { label })
      setBlocks(prev => [...prev, res.data.block])
      setShowPicker(false)
      setCustomLabel('')
    } catch (err) {
      console.error(err)
    }
  }

  const updateItems = async (id, items) => {
    const res = await axios.patch(`/api/rhythm/${id}`, { items })
    setBlocks(prev => prev.map(b => b.id === id ? res.data.block : b))
  }

  const updateLabel = async (id, label) => {
    if (!label.trim()) return
    const res = await axios.patch(`/api/rhythm/${id}`, { label })
    setBlocks(prev => prev.map(b => b.id === id ? res.data.block : b))
  }

  const deleteBlock = async (id) => {
    await axios.delete(`/api/rhythm/${id}`)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const setLayoutAndSave = (val) => {
    setLayout(val)
    localStorage.setItem('rhythm_layout', val)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    setBlocks(reordered)
    await axios.post('/api/rhythm/reorder', { orderedIds: reordered.map(b => b.id) })
  }

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }))

  const existingLabels = new Set(blocks.map(b => b.label))

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your week...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className={`mx-auto px-5 py-10 ${layout === 'columns' ? 'max-w-5xl' : 'max-w-lg'}`}>

        {/* nav */}
        <div className="flex items-center justify-between mb-8">
          <Link to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-[#ede9f5] rounded-lg p-0.5">
              <button
                onClick={() => setLayoutAndSave('list')}
                title="list view"
                className="px-2 py-1 rounded-md text-xs transition-colors"
                style={layout === 'list' ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)' } : { color: 'var(--sp-text-faint)' }}
              >
                ☰
              </button>
              <button
                onClick={() => setLayoutAndSave('columns')}
                title="column view"
                className="px-2 py-1 rounded-md text-xs transition-colors"
                style={layout === 'columns' ? { background: '#c4b5fd22', color: 'var(--sp-text-muted)' } : { color: 'var(--sp-text-faint)' }}
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        {/* heading */}
        <h1 className="text-2xl font-medium text-[#2d2a35] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          my week
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">your living map of how the week flows</p>

        {/* empty state */}
        {blocks.length === 0 && !showPicker && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">🗓️</p>
            <p className="text-sm text-[#a89bc2] mb-2">your week is a blank page</p>
            <p className="text-xs text-[#c4b8d9] mb-6">add a day or routine to get started</p>
            <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>build my week</Button>
          </div>
        )}

        {/* blocks */}
        {blocks.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className={layout === 'columns'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 items-start'
                : 'space-y-3 mb-6'
              }>
                {blocks.map(block => (
                  <WeekBlock
                    key={block.id}
                    block={block}
                    onUpdateItems={updateItems}
                    onUpdateLabel={updateLabel}
                    onDelete={deleteBlock}
                    compact={layout === 'columns'}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* add block */}
        {showPicker ? (
          <div className="bg-white border border-[#ede9f5] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-[#a89bc2] uppercase tracking-widest">add a slot</p>
              <button onClick={() => { setShowPicker(false); setCustomLabel('') }} className="text-[#c4b8d9] hover:text-[#a89bc2] text-sm transition-colors">✕</button>
            </div>

            {PRESET_GROUPS.map(group => {
              const available = group.presets.filter(p => !existingLabels.has(p.label))
              if (!available.length) return null
              return (
                <div key={group.label} className="mb-4">
                  <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {available.map(p => (
                      <button
                        key={p.label}
                        onClick={() => addBlock(p.label)}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#faf8ff] border border-[#e4dff0] text-[#7c6f9b] hover:border-[#c4b5fd] transition-colors"
                      >
                        {p.emoji} {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="border-t border-[#f0ecfa] pt-4 mt-2">
              <p className="text-[10px] text-[#c4b8d9] uppercase tracking-wider mb-2">custom</p>
              <div className="flex gap-2">
                <input
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && customLabel.trim() && addBlock(customLabel)}
                  placeholder="name your slot..."
                  autoFocus
                  className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
                />
                <Button variant="secondary" size="sm" onClick={() => customLabel.trim() && addBlock(customLabel)} disabled={!customLabel.trim()}>add</Button>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="secondary" full onClick={() => setShowPicker(true)}>+ add a slot</Button>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}

function WeekBlock({ block, onUpdateItems, onUpdateLabel, onDelete, compact = false }) {
  const [newItem, setNewItem]           = useState('')
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft]     = useState(block.label)
  const [collapsed, setCollapsed]       = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const addItem = () => {
    if (!newItem.trim()) return
    onUpdateItems(block.id, [...block.items, newItem.trim()])
    setNewItem('')
  }

  const removeItem = (idx) => {
    onUpdateItems(block.id, block.items.filter((_, i) => i !== idx))
  }

  const saveLabel = () => {
    onUpdateLabel(block.id, labelDraft)
    setEditingLabel(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-white border border-[#ede9f5] rounded-2xl overflow-hidden"
    >
      {/* header */}
      <div className={`flex items-center gap-2 ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <button
          {...attributes}
          {...listeners}
          className="text-[#d4cfe3] hover:text-[#a89bc2] cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none select-none"
        >
          ⠿
        </button>

        {editingLabel ? (
          <input
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={e => e.key === 'Enter' && saveLabel()}
            autoFocus
            className="flex-1 text-sm font-medium text-[#2d2a35] bg-transparent focus:outline-none border-b border-[#c4b5fd]"
          />
        ) : (
          <button
            onClick={() => setEditingLabel(true)}
            className="flex-1 text-left text-sm font-medium text-[#2d2a35] hover:text-[#7c6f9b] transition-colors"
          >
            {block.label}
          </button>
        )}

        {block.items.length > 0 && (
          <span className="text-[10px] text-[#d4cfe3]">{block.items.length}</span>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors w-4 text-center"
        >
          {collapsed ? '▼' : '▲'}
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="text-[10px] text-[#e4dff0] hover:text-rose-300 transition-colors"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className={`border-t border-[#f5f2fc] ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
          {block.items.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {block.items.map((item, idx) => (
                <li key={idx} className="group flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c4b5fd] shrink-0" />
                  <span className="flex-1 text-sm text-[#5a5065] leading-snug">{item}</span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-[10px] text-[#e4dff0] hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full border border-[#d4cfe3] shrink-0" />
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder={block.items.length === 0 ? 'what happens during this time?' : 'add another...'}
              className="flex-1 text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#d4cfe3]"
            />
            {newItem.trim() && (
              <Button variant="secondary" size="sm" onClick={addItem}>add</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
