import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { uploadImage } from '../utils/uploadImage'
import Button from '../components/Button'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function StarRating({ value, onChange, size = 'sm' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'sm' ? 'text-sm' : 'text-lg'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`${sz} transition-colors`}
          style={{ color: n <= (hover || value || 0) ? '#f59e0b' : '#e4dff0' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange && onChange(n === value ? null : n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const RECIPE_DEFAULTS = {
  title: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  steps: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  rating: null,
  notes: '',
  tags: [],
  tagInput: '',
  coverUrl: '',
  isPublic: false,
}

function RecipeForm({ initial, accent, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    ...initial,
    ingredients: initial.ingredients?.length ? initial.ingredients : [{ name: '', amount: '', unit: '' }],
    steps: initial.steps?.length ? initial.steps : [''],
    tags: initial.tags || [],
    tagInput: '',
  } : RECIPE_DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const accentRgb = hexToRgb(accent)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ingredients
  const setIngredient = (i, key, val) => {
    setForm(f => {
      const ingredients = [...f.ingredients]
      ingredients[i] = { ...ingredients[i], [key]: val }
      return { ...f, ingredients }
    })
  }
  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: '' }] }))
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  // steps
  const setStep = (i, val) => setForm(f => {
    const steps = [...f.steps]
    steps[i] = val
    return { ...f, steps }
  })
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, ''] }))
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))

  // tags
  const addTag = () => {
    const t = form.tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    set('tagInput', '')
  }

  // cover upload
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'recipes')
      set('coverUrl', url)
    } catch {
      // ignore
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || null,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        steps: form.steps.filter(s => s.trim()),
        prepTime: form.prepTime ? parseInt(form.prepTime) : null,
        cookTime: form.cookTime ? parseInt(form.cookTime) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        rating: form.rating,
        notes: form.notes.trim() || null,
        tags: form.tags,
        coverUrl: form.coverUrl || null,
        isPublic: form.isPublic,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]'
  const smallInputClass = 'text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]'

  return (
    <form onSubmit={submit} className="bg-white border border-[#e4dff0] rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
          {initial ? 'edit recipe' : 'new recipe'}
        </p>
        <button type="button" onClick={onCancel} className="text-[#c4b8d9] hover:text-[#a89bc2]">✕</button>
      </div>

      {/* cover */}
      <div className="flex gap-3 items-start">
        <div>
          {form.coverUrl ? (
            <div className="relative">
              <img src={form.coverUrl} alt="cover" className="w-20 h-20 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => set('coverUrl', '')}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 text-white text-[8px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e4dff0] flex items-center justify-center cursor-pointer hover:border-[#c4b5fd] transition-colors"
            >
              {uploading ? <span className="text-[10px] text-[#a89bc2]">…</span> : <span className="text-2xl">🍽</span>}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
          {!form.coverUrl && <p className="text-[9px] text-[#d4cfe3] mt-1 text-center">cover</p>}
        </div>
        <div className="flex-1 space-y-2">
          <input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="recipe title…" className={inputClass} />
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="a short description…"
            rows={2}
            className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* times + servings */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-[#a89bc2] block mb-1">prep (min)</label>
          <input type="number" min="0" value={form.prepTime} onChange={e => set('prepTime', e.target.value)} placeholder="15" className={smallInputClass + ' w-full'} />
        </div>
        <div>
          <label className="text-[10px] text-[#a89bc2] block mb-1">cook (min)</label>
          <input type="number" min="0" value={form.cookTime} onChange={e => set('cookTime', e.target.value)} placeholder="30" className={smallInputClass + ' w-full'} />
        </div>
        <div>
          <label className="text-[10px] text-[#a89bc2] block mb-1">servings</label>
          <input type="number" min="1" value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="4" className={smallInputClass + ' w-full'} />
        </div>
      </div>

      {/* ingredients */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a89bc2] mb-2">ingredients</p>
        <div className="space-y-2">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ing.amount}
                onChange={e => setIngredient(i, 'amount', e.target.value)}
                placeholder="qty"
                className="w-16 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-2 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
              />
              <input
                value={ing.unit}
                onChange={e => setIngredient(i, 'unit', e.target.value)}
                placeholder="unit"
                className="w-16 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-2 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
              />
              <input
                value={ing.name}
                onChange={e => setIngredient(i, 'name', e.target.value)}
                placeholder="ingredient"
                className="flex-1 text-sm text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
              />
              {form.ingredients.length > 1 && (
                <button type="button" onClick={() => removeIngredient(i)} className="text-[#d4cfe3] hover:text-rose-400 shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-2" type="button" onClick={addIngredient}>+ add ingredient</Button>
      </div>

      {/* steps */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a89bc2] mb-2">steps</p>
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-[11px] text-[#c4b8d9] mt-2.5 w-5 text-right shrink-0">{i + 1}.</span>
              <textarea
                value={step}
                onChange={e => setStep(i, e.target.value)}
                placeholder={`step ${i + 1}…`}
                rows={2}
                className="flex-1 text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] resize-none leading-relaxed"
              />
              {form.steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} className="text-[#d4cfe3] hover:text-rose-400 mt-2 shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-2" type="button" onClick={addStep}>+ add step</Button>
      </div>

      {/* rating */}
      <div>
        <p className="text-[10px] text-[#a89bc2] mb-1">rating</p>
        <StarRating value={form.rating} onChange={v => set('rating', v)} size="base" />
      </div>

      {/* notes */}
      <textarea
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="notes, tips, variations…"
        rows={2}
        className="w-full text-sm text-[#5a5065] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] resize-none leading-relaxed"
      />

      {/* tags */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `rgba(${accentRgb}, 0.12)`, color: accent }}>
              {t}
              <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="opacity-70 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
        <input
          value={form.tagInput}
          onChange={e => set('tagInput', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder="add tag, press Enter"
          className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9]"
        />
      </div>

      {/* public toggle + submit */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => set('isPublic', !form.isPublic)}
          className="text-[11px] px-3 py-1.5 rounded-full border transition-colors"
          style={form.isPublic
            ? { background: `rgba(${accentRgb}, 0.12)`, color: accent, borderColor: `${accent}66` }
            : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
        >
          {form.isPublic ? '✦ public' : 'private'}
        </button>
        <div className="flex gap-2">
          <Button variant="quiet" type="button" onClick={onCancel}>cancel</Button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="text-xs px-4 py-2 rounded-xl text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            {saving ? 'saving…' : initial ? 'update' : 'add recipe'}
          </button>
        </div>
      </div>
    </form>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'desserts']

function getMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

function MealPlanPopover({ recipe, accent, accentRgb, onClose, onSuccess }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [mealType, setMealType] = useState('dinner')
  const [adding, setAdding] = useState(false)

  const confirm = async () => {
    if (selectedDay === null) return
    setAdding(true)
    try {
      await axios.post('/api/meals/entries', {
        weekStart: getMonday(),
        day: selectedDay,
        mealType,
        name: recipe.title,
      })
      onSuccess()
      onClose()
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className="absolute right-0 top-7 z-20 bg-white border border-[#e4dff0] rounded-2xl shadow-xl p-3 w-56"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a89bc2] mb-2">add to meal plan</p>

      {/* day selector */}
      <div className="flex gap-1 flex-wrap mb-2">
        {DAYS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(i)}
            className="text-[10px] px-2 py-1 rounded-lg border transition-colors"
            style={selectedDay === i
              ? { background: `rgba(${accentRgb}, 0.15)`, color: accent, borderColor: `${accent}66` }
              : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* meal type selector */}
      <select
        value={mealType}
        onChange={e => setMealType(e.target.value)}
        className="w-full text-xs text-[#2d2a35] bg-[#faf8ff] border border-[#e4dff0] rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#a89bc2] mb-2"
      >
        {MEAL_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <div className="flex gap-1.5 justify-end">
        <Button variant="quiet" type="button" onClick={onClose}>cancel</Button>
        <button
          type="button"
          onClick={confirm}
          disabled={selectedDay === null || adding}
          className="text-[10px] px-3 py-1 rounded-lg text-white disabled:opacity-40 transition-opacity"
          style={{ background: accent }}
        >
          {adding ? '…' : 'add'}
        </button>
      </div>
    </div>
  )
}

function RecipeCard({ recipe, accent, onEdit, onDelete, onMealPlanSuccess }) {
  const accentRgb = hexToRgb(accent)
  const [deleting, setDeleting] = useState(false)
  const [showMealPlan, setShowMealPlan] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(recipe.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-[#e4dff0] rounded-2xl overflow-hidden group hover:border-[#c4b5fd]/40 transition-colors hover:shadow-sm">
      {/* cover */}
      {recipe.coverUrl ? (
        <img src={recipe.coverUrl} alt={recipe.title} className="w-full h-36 object-cover" />
      ) : (
        <div
          className="w-full h-28 flex items-center justify-center text-4xl"
          style={{ background: `rgba(${accentRgb}, 0.08)` }}
        >
          🍽
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#2d2a35] leading-snug">{recipe.title}</p>
          <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity items-center">
            {/* meal plan button */}
            <div className="relative">
              <button
                onClick={() => setShowMealPlan(v => !v)}
                title="add to meal plan"
                className="text-[12px] text-[#c4b8d9] hover:text-[#7c6f9b] leading-none"
              >
                📅
              </button>
              {showMealPlan && (
                <MealPlanPopover
                  recipe={recipe}
                  accent={accent}
                  accentRgb={accentRgb}
                  onClose={() => setShowMealPlan(false)}
                  onSuccess={onMealPlanSuccess}
                />
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => onEdit(recipe)}>edit</Button>
            <button onClick={handleDelete} disabled={deleting} className="text-[10px] text-[#c4b8d9] hover:text-rose-400 disabled:opacity-40">
              {deleting ? '…' : '✕'}
            </button>
          </div>
        </div>

        {recipe.description && (
          <p className="text-[11px] text-[#a89bc2] mt-1 line-clamp-2 leading-relaxed">{recipe.description}</p>
        )}

        {/* meta row */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[#c4b8d9]">
          {recipe.prepTime && <span>⏱ {recipe.prepTime + (recipe.cookTime ? '+' + recipe.cookTime : '')} min</span>}
          {recipe.servings && <span>👥 {recipe.servings}</span>}
          {recipe.isPublic && <span style={{ color: accent }}>✦</span>}
        </div>

        {recipe.rating > 0 && (
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className="text-sm" style={{ color: n <= recipe.rating ? '#f59e0b' : '#e4dff0' }}>★</span>
            ))}
          </div>
        )}

        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.tags.map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `rgba(${accentRgb}, 0.1)`, color: accent }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecipesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [filterTag, setFilterTag] = useState(null)

  const accent = user?.accentColor || '#c4b5fd'

  useEffect(() => {
    axios.get('/api/recipes')
      .then(res => setRecipes(res.data.recipes || res.data || []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (data) => {
    try {
      const res = await axios.post('/api/recipes', data)
      setRecipes(prev => [res.data.recipe || res.data, ...prev])
      setShowForm(false)
      showToast('recipe added', 'success')
    } catch {
      showToast('could not add recipe', 'error')
      throw new Error('failed')
    }
  }

  const handleUpdate = async (data) => {
    try {
      const res = await axios.patch(`/api/recipes/${editingRecipe.id}`, data)
      setRecipes(prev => prev.map(r => r.id === editingRecipe.id ? (res.data.recipe || res.data) : r))
      setEditingRecipe(null)
      showToast('recipe updated', 'success')
    } catch {
      showToast('could not update recipe', 'error')
      throw new Error('failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/recipes/${id}`)
      setRecipes(prev => prev.filter(r => r.id !== id))
      showToast('recipe deleted', 'success')
    } catch {
      showToast('could not delete recipe', 'error')
      throw new Error('failed')
    }
  }

  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))]
  const visible = filterTag ? recipes.filter(r => r.tags?.includes(filterTag)) : recipes

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-2">
      <div className="h-0.5 w-full" style={{ background: accent }} />
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium text-[#2d2a35]" style={{ fontFamily: 'var(--font-serif)' }}>
              recipes
            </h1>
            <p className="text-sm text-[#a89bc2] mt-1">your personal recipe book</p>
          </div>
          {!showForm && !editingRecipe && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: accent }}
            >
              + add recipe
            </button>
          )}
        </div>

        {/* tag filter */}
        {allTags.length > 0 && !showForm && !editingRecipe && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setFilterTag(null)}
              className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
              style={!filterTag ? { background: 'color-mix(in srgb, var(--sp-text) 13%, transparent)', color: 'var(--sp-text)', borderColor: 'color-mix(in srgb, var(--sp-text) 27%, transparent)' } : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
            >
              all
            </button>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => setFilterTag(filterTag === t ? null : t)}
                className="text-[10px] px-2.5 py-1 rounded-full border transition-colors"
                style={filterTag === t
                  ? { background: `${accent}22`, color: accent, borderColor: `${accent}66` }
                  : { color: 'var(--sp-text-faint)', borderColor: 'var(--sp-border)' }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* add form */}
        {showForm && (
          <div className="mb-6">
            <RecipeForm accent={accent} onSave={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {/* edit form */}
        {editingRecipe && (
          <div className="mb-6">
            <RecipeForm initial={editingRecipe} accent={accent} onSave={handleUpdate} onCancel={() => setEditingRecipe(null)} />
          </div>
        )}

        {loading ? (
          <p className="text-[#a89bc2] text-sm text-center py-16">loading...</p>
        ) : visible.length === 0 && !showForm ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🍽</p>
            <p className="text-sm text-[#a89bc2] mb-6">
              {filterTag ? `no recipes tagged "${filterTag}"` : 'your recipe book is empty'}
            </p>
            {!filterTag && (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: accent }}
              >
                add your first recipe
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                accent={accent}
                onEdit={(r) => { setEditingRecipe(r); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                onDelete={handleDelete}
                onMealPlanSuccess={() => showToast('Added to meal plan ✓', 'success')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
