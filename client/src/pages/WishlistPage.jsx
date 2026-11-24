import { useEffect, useState } from 'react'

import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import SeasonBadge from '../components/SeasonBadge'
import Button from '../components/Button'
import BackLink from '../components/BackLink'

const CATEGORIES = [
  { key: 'cook',  label: 'cook',  emoji: '🍳' },
  { key: 'eat',   label: 'eat',   emoji: '🍜' },
  { key: 'watch', label: 'watch', emoji: '📺' },
  { key: 'read',  label: 'read',  emoji: '📖' },
  { key: 'play',  label: 'play',  emoji: '🎮' },
  { key: 'visit', label: 'visit', emoji: '🗺️' },
  { key: 'learn', label: 'learn', emoji: '🌱' },
  { key: 'buy',   label: 'buy',   emoji: '🛍️' },
]

export default function WishlistPage() {
  const { user } = useAuth()

  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('cook')
  const [newTitle, setNewTitle]     = useState('')
  const [newNotes, setNewNotes]     = useState('')
  const [showNotes, setShowNotes]   = useState(false)
  const [adding, setAdding]         = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [editTitle, setEditTitle]   = useState('')
  const [activeSeason, setActiveSeason] = useState(null)

  useEffect(() => {
    axios.get('/api/wishlist')
      .then(res => setItems(res.data.items))
      .finally(() => setLoading(false))
    axios.get('/api/seasons/active')
      .then(r => setActiveSeason(r.data.season || null))
      .catch(() => {})
  }, [])

  const categoryItems = items.filter(i => i.category === activeTab)
  const pending   = categoryItems.filter(i => !i.completed)
  const completed = categoryItems.filter(i => i.completed)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await axios.post('/api/wishlist', {
        category: activeTab,
        title: newTitle,
        notes: newNotes || null,
        seasonId: activeSeason?.id || null,
      })
      setItems(prev => [...prev, res.data.item])
      setNewTitle('')
      setNewNotes('')
      setShowNotes(false)
    } finally {
      setAdding(false)
    }
  }

  const toggleComplete = async (item) => {
    const res = await axios.patch(`/api/wishlist/${item.id}`, { completed: !item.completed })
    setItems(prev => prev.map(i => i.id === item.id ? res.data.item : i))
  }

  const handleDelete = async (id) => {
    await axios.delete(`/api/wishlist/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return
    const res = await axios.patch(`/api/wishlist/${id}`, { title: editTitle })
    setItems(prev => prev.map(i => i.id === id ? res.data.item : i))
    setEditingId(null)
  }

  const activeCat = CATEGORIES.find(c => c.key === activeTab)
  const totalCount = items.filter(i => !i.completed).length

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading your wanting list...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="h-1 w-full bg-[#c4b5fd]" />
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* nav */}
        <div className="flex items-center justify-between mb-8">
          <BackLink to={`/u/${user.username}`} className="text-xs text-[#b0a3c8] hover:text-[#7c6f9b] transition-colors">
            ← your page
          </BackLink>
          <p className="text-xs text-[#c4b8d9]">
            {totalCount} {totalCount === 1 ? 'thing' : 'things'} still wanting
          </p>
        </div>

        {/* heading */}
        <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--sp-text)' }}>
          the wanting list
        </h1>
        <p className="text-sm text-[#a89bc2] mb-8">things you're saving for someday</p>

        {/* category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.key && !i.completed).length
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                style={activeTab === cat.key ? {
                  background: '#c4b5fd22',
                  color: 'var(--sp-text-muted)',
                  border: '1px solid #c4b5fd66',
                } : {
                  background: 'var(--sp-surface)',
                  color: 'var(--sp-text-faint)',
                  border: '1px solid var(--sp-border-faint)',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c4b5fd33] text-[#7c6f9b]">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* add form */}
        <div className="bg-white border border-[#ede9f5] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{activeCat.emoji}</span>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={`something to ${activeCat.label}...`}
              className="flex-1 text-sm text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#c4b8d9]"
            />
            <button
              onClick={() => setShowNotes(s => !s)}
              className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors"
              title="add a note"
            >
              ···
            </button>
            <Button variant="secondary" size="sm" onClick={handleAdd} disabled={adding || !newTitle.trim()}>add</Button>
          </div>
          {showNotes && (
            <input
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="any notes? (optional)"
              className="w-full text-xs text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
            />
          )}
        </div>

        {/* items */}
        {categoryItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-[#c4b8d9]">
              nothing here yet — add something to {activeCat.label}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {pending.map(item => (
              <WishItem
                key={item.id}
                item={item}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onToggle={toggleComplete}
                onDelete={handleDelete}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}

            {completed.length > 0 && (
              <>
                <p className="text-xs text-[#c4b8d9] uppercase tracking-widest pt-4 pb-1 px-1">
                  done
                </p>
                {completed.map(item => (
                  <WishItem
                    key={item.id}
                    item={item}
                    editingId={editingId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onToggle={toggleComplete}
                    onDelete={handleDelete}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#d4cfe3] mt-12">✦ the save point</p>
      </div>
    </div>
  )
}

function WishItem({ item, editingId, editTitle, setEditTitle, onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit }) {
  const isEditing = editingId === item.id

  return (
    <div className={`group flex items-start gap-3 bg-white border border-[#ede9f5] rounded-xl px-4 py-3 transition-opacity ${item.completed ? 'opacity-50' : ''}`}>
      {/* checkbox */}
      <button
        onClick={() => onToggle(item)}
        className="mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
        style={{
          borderColor: item.completed ? '#c4b5fd' : '#d4cfe3',
          background: item.completed ? '#c4b5fd' : 'transparent',
        }}
      >
        {item.completed && <span className="text-white text-[10px]">✓</span>}
      </button>

      {/* title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSaveEdit(item.id)
              if (e.key === 'Escape') onCancelEdit()
            }}
            autoFocus
            className="w-full text-sm text-[#2d2a35] bg-transparent focus:outline-none border-b border-[#c4b5fd]"
          />
        ) : (
          <p
            className={`text-sm text-[#2d2a35] cursor-pointer ${item.completed ? 'line-through text-[#c4b8d9]' : ''}`}
            onDoubleClick={() => onStartEdit(item)}
          >
            {item.title}
          </p>
        )}
        {item.notes && !isEditing && (
          <p className="text-xs text-[#a89bc2] mt-0.5">{item.notes}</p>
        )}
        {item.season && !isEditing && (
          <div className="mt-1.5">
            <SeasonBadge season={item.season} />
          </div>
        )}
      </div>

      {/* actions */}
      {isEditing ? (
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={() => onSaveEdit(item.id)}>save</Button>
          <Button variant="quiet" onClick={onCancelEdit}>cancel</Button>
        </div>
      ) : (
        <button
          onClick={() => onDelete(item.id)}
          className="text-[#e4dff0] hover:text-rose-300 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  )
}
