import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { uploadImage } from '../utils/uploadImage'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const MOODS = [
  { emoji: '✨', label: 'inspired' },
  { emoji: '🌸', label: 'soft' },
  { emoji: '😊', label: 'happy' },
  { emoji: '🥺', label: 'tender' },
  { emoji: '😔', label: 'melancholy' },
  { emoji: '😤', label: 'frustrated' },
  { emoji: '🌙', label: 'dreamy' },
  { emoji: '☕', label: 'cozy' },
  { emoji: '🔥', label: 'passionate' },
  { emoji: '😌', label: 'peaceful' },
  { emoji: '🤔', label: 'reflective' },
  { emoji: '🎉', label: 'excited' },
  { emoji: '😴', label: 'tired' },
  { emoji: '💔', label: 'heartbroken' },
  { emoji: '🌿', label: 'grounded' },
  { emoji: '⚡', label: 'electric' },
]

function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ resize: 'none', overflow: 'hidden' }}
    />
  )
}

export default function BlogEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  useAuth()
  const { showToast } = useToast()

  const [title, setTitle]     = useState('')
  const [mood, setMood]       = useState('')
  const [music, setMusic]     = useState('')
  const [blocks, setBlocks]   = useState([{ type: 'text', value: '' }])
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags]       = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(!!id)
  const [showMoods, setShowMoods] = useState(false)

  useEffect(() => {
    if (!id) return
    axios.get(`/api/blog/${id}`)
      .then(res => {
        const p = res.data.post
        setTitle(p.title)
        setMood(p.mood || '')
        setMusic(p.music || '')
        setBlocks(Array.isArray(p.content) && p.content.length ? p.content : [{ type: 'text', value: '' }])
        setCoverUrl(p.coverUrl || '')
        setTags(p.tags || [])
        setIsPublic(p.isPublic)
      })
      .catch(() => showToast('could not load post'))
      .finally(() => setLoading(false))
  }, [id])

  const updateBlock = (i, patch) =>
    setBlocks(bs => bs.map((b, idx) => idx === i ? { ...b, ...patch } : b))

  const insertAfter = (i, type) => {
    const newBlock = type === 'image' ? { type: 'image', url: '', caption: '' } : { type: 'text', value: '' }
    setBlocks(bs => [...bs.slice(0, i + 1), newBlock, ...bs.slice(i + 1)])
  }

  const removeBlock = i =>
    setBlocks(bs => bs.length === 1 ? [{ type: 'text', value: '' }] : bs.filter((_, idx) => idx !== i))

  const handleImageUpload = async (i, file) => {
    if (!file) return
    const url = await uploadImage(file, 'blog', 900)
    updateBlock(i, { url })
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(ts => [...ts, t])
    setTagInput('')
  }

  const save = async (pub) => {
    if (!title.trim()) return showToast('give your post a title first')
    setSaving(true)
    try {
      const payload = {
        title, content: blocks, coverUrl: coverUrl || null,
        tags, mood: mood || null, music: music || null,
        isPublic: pub ?? isPublic,
      }
      const res = id
        ? await axios.patch(`/api/blog/${id}`, payload)
        : await axios.post('/api/blog', payload)
      if (pub !== undefined) setIsPublic(pub)
      showToast(pub ? 'post published ✦' : 'draft saved')
      if (!id) navigate(`/blog/edit/${res.data.post.id}`, { replace: true })
    } catch {
      showToast('could not save — try again')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <p className="text-sm text-[#a89bc2]">loading...</p>
    </div>
  )

  const selectedMood = MOODS.find(m => m.label === mood)

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* toolbar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#e4dff0] px-5 py-2.5 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/blog')} className="text-[#a89bc2] hover:text-[#5a5065] transition-colors text-sm">
          ← back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="text-xs px-4 py-1.5 rounded-full border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] hover:text-[#5a5065] transition-colors disabled:opacity-40"
          >save draft</button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="text-xs px-4 py-1.5 rounded-full text-white transition-opacity disabled:opacity-40"
            style={{ background: '#c4b5fd' }}
          >{isPublic ? 'update' : 'publish'}</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* cover image */}
        <div>
          {coverUrl ? (
            <div className="relative rounded-2xl overflow-hidden mb-3" style={{ height: '220px' }}>
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => setCoverUrl('')}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors text-sm"
              >✕</button>
            </div>
          ) : (
            <button
              onClick={() => document.getElementById('cover-upload').click()}
              className="w-full h-20 rounded-2xl border-2 border-dashed border-[#e4dff0] flex items-center justify-center gap-2 text-[#c4b8d9] hover:border-[#a89bc2] hover:text-[#a89bc2] transition-colors text-sm mb-3"
            >📷 add cover image</button>
          )}
          <input id="cover-upload" type="file" accept="image/*" className="hidden"
            onChange={async e => {
              const f = e.target.files[0]; if (!f) return
              const url = await uploadImage(f, 'blog')
              setCoverUrl(url)
            }}
          />
        </div>

        {/* title */}
        <AutoTextarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="title..."
          className="w-full text-3xl font-medium text-[#2d2a35] bg-transparent focus:outline-none placeholder-[#d4cfe3] leading-snug"
          style={{ fontFamily: 'var(--font-serif)' }}
        />

        {/* mood + music row */}
        <div className="flex flex-wrap items-center gap-3 text-sm border-y border-[#e4dff0] py-3">
          <div className="relative">
            <button
              onClick={() => setShowMoods(v => !v)}
              className="flex items-center gap-1.5 text-[#a89bc2] hover:text-[#5a5065] transition-colors text-xs"
            >
              {selectedMood ? <span>{selectedMood.emoji} feeling {selectedMood.label}</span> : <span>+ mood</span>}
            </button>
            {showMoods && (
              <div className="absolute top-7 left-0 z-10 bg-white border border-[#e4dff0] rounded-2xl shadow-lg p-3 grid grid-cols-4 gap-1.5 w-52">
                {mood && (
                  <button onClick={() => { setMood(''); setShowMoods(false) }} className="col-span-4 text-[10px] text-[#c4b8d9] hover:text-rose-400 mb-1 text-left">clear</button>
                )}
                {MOODS.map(m => (
                  <button key={m.label} onClick={() => { setMood(m.label); setShowMoods(false) }}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl hover:bg-[#f5f0ff] transition-colors"
                    title={m.label}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-[9px] text-[#a89bc2]">{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[#e4dff0]">·</span>

          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[#c4b8d9] text-xs shrink-0">🎵</span>
            <input
              value={music}
              onChange={e => setMusic(e.target.value)}
              placeholder="listening to..."
              className="text-xs text-[#5a5065] bg-transparent focus:outline-none placeholder-[#d4cfe3] min-w-0 flex-1"
            />
          </div>
        </div>

        {/* content blocks */}
        <div className="space-y-1">
          {blocks.map((block, i) => (
            <div key={i} className="group relative">
              {block.type === 'text' ? (
                <AutoTextarea
                  value={block.value}
                  onChange={e => updateBlock(i, { value: e.target.value })}
                  placeholder="write something..."
                  className="w-full text-[15px] text-[#3d3545] bg-transparent focus:outline-none placeholder-[#d4cfe3] leading-relaxed py-1"
                />
              ) : (
                <div className="rounded-2xl overflow-hidden bg-[#f5f0ff]/40 border border-[#e4dff0]">
                  {block.url ? (
                    <div className="relative">
                      <img src={block.url} alt={block.caption} className="w-full max-h-[500px] object-contain" />
                      <button onClick={() => updateBlock(i, { url: '' })}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => document.getElementById(`img-${i}`).click()}
                      className="w-full h-36 flex items-center justify-center gap-2 text-[#c4b8d9] hover:text-[#a89bc2] transition-colors text-sm"
                    >📷 click to upload image</button>
                  )}
                  <input id={`img-${i}`} type="file" accept="image/*" className="hidden"
                    onChange={e => handleImageUpload(i, e.target.files[0])} />
                  <input
                    value={block.caption || ''}
                    onChange={e => updateBlock(i, { caption: e.target.value })}
                    placeholder="caption (optional)"
                    className="w-full px-4 py-2 text-xs text-[#a89bc2] bg-transparent focus:outline-none placeholder-[#d4cfe3] border-t border-[#e4dff0]"
                  />
                </div>
              )}

              {/* block controls */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-8 top-1 flex flex-col gap-1">
                {blocks.length > 1 && (
                  <button onClick={() => removeBlock(i)}
                    className="w-6 h-6 rounded-full bg-[#f5f0ff] text-[#c4b8d9] hover:text-rose-400 hover:bg-rose-50 text-xs flex items-center justify-center transition-colors">
                    ✕
                  </button>
                )}
              </div>

              {/* insert block button */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity py-1 mt-0.5">
                <div className="flex-1 h-px bg-[#e4dff0]" />
                <button onClick={() => insertAfter(i, 'text')}
                  className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors px-2 py-0.5 rounded-full hover:bg-[#f5f0ff]">
                  + text
                </button>
                <button onClick={() => insertAfter(i, 'image')}
                  className="text-[10px] text-[#c4b8d9] hover:text-[#a89bc2] transition-colors px-2 py-0.5 rounded-full hover:bg-[#f5f0ff]">
                  + image
                </button>
                <div className="flex-1 h-px bg-[#e4dff0]" />
              </div>
            </div>
          ))}
        </div>

        {/* tags */}
        <div className="border-t border-[#e4dff0] pt-4 space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-[#c4b8d9]"># tags:</span>
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#f0ebff] text-[#7c6f9b]">
                {t}
                <button onClick={() => setTags(ts => ts.filter(x => x !== t))} className="hover:text-rose-400 transition-colors leading-none">×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              onBlur={addTag}
              placeholder="add tag, press enter"
              className="text-xs text-[#5a5065] bg-transparent focus:outline-none placeholder-[#d4cfe3] min-w-20"
            />
          </div>
        </div>

        {/* visibility */}
        <div className="flex items-center justify-between border border-[#e4dff0] rounded-2xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#2d2a35]">{isPublic ? '✦ published' : 'draft'}</p>
            <p className="text-xs text-[#c4b8d9] mt-0.5">{isPublic ? 'visible on your profile' : 'only you can see this'}</p>
          </div>
          <button
            onClick={() => setIsPublic(v => !v)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={isPublic
              ? { background: 'rgba(196,181,253,0.12)', color: '#7c6f9b', borderColor: 'rgba(196,181,253,0.4)' }
              : { color: '#c4b8d9', borderColor: '#e4dff0' }}
          >{isPublic ? 'unpublish' : 'make public'}</button>
        </div>

      </div>
    </div>
  )
}
