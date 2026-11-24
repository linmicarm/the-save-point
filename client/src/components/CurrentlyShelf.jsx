import { useState, useRef } from 'react'
import MediaSearch from './MediaSearch'
import { uploadImage } from '../utils/uploadImage'

function ImagePicker({ imageUrl, onImageUrl, compact = false }) {
  const fileRef = useRef(null)
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = await uploadImage(file, 'media')
    onImageUrl(url)
  }
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-2'}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
      ) : null}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-[11px] px-2 py-1 rounded-lg border border-[#e4dff0] text-[#a89bc2] hover:border-[#a89bc2] transition-colors whitespace-nowrap"
      >
        {imageUrl ? 'change photo' : '+ photo'}
      </button>
      {imageUrl && (
        <button type="button" onClick={() => onImageUrl('')} className="text-[11px] text-[#c4b8d9] hover:text-rose-400 transition-colors">remove</button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function CoverTile({ item, isOwn, onRemove, portrait = true }) {
  const size = portrait ? 'w-20 h-[7rem]' : 'w-20 h-20'
  return (
    <div className="group relative shrink-0 w-20">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className={`${size} rounded-xl object-cover shadow-sm`}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }}
        />
      ) : null}
      <div
        className={`${size} rounded-xl flex items-center justify-center p-2 shadow-sm ${item.imageUrl ? 'hidden' : ''}`}
        style={{ background: 'var(--sp-surface-2)' }}
      >
        <p className="text-[9px] text-center leading-tight line-clamp-4" style={{ color: 'var(--sp-text-faint)' }}>{item.title}</p>
      </div>
      {isOwn && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#7c6f9b] text-white text-xs leading-none items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hidden group-hover:flex"
        >×</button>
      )}
      <p className="text-[9px] text-[#a89bc2] mt-1.5 leading-tight line-clamp-2 w-20">{item.title}</p>
    </div>
  )
}

function ManualAddForm({ onCommit, onCancel, showSearch, type, label, accentRgb, accent }) {
  const [mode, setMode]   = useState(showSearch ? 'search' : 'manual')
  const [title, setTitle] = useState('')
  const [imgUrl, setImgUrl] = useState('')

  const commit = () => {
    if (!title.trim()) return
    onCommit({ title: title.trim(), imageUrl: imgUrl || null })
  }

  return (
    <div className="mt-2 rounded-xl p-3 shadow-sm space-y-2.5" style={{ background: 'var(--sp-surface)', border: '1px solid var(--sp-border)' }}>
      {showSearch && (
        <div className="flex gap-2 mb-1">
          {['search', 'manual'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="text-[11px] px-2.5 py-1 rounded-lg transition-colors"
              style={mode === m
                ? { background: `rgba(${accentRgb},0.12)`, color: accent, fontWeight: 500 }
                : { color: '#c4b8d9' }}
            >{m === 'search' ? 'search' : 'add manually'}</button>
          ))}
        </div>
      )}

      {mode === 'search' && showSearch ? (
        <MediaSearch
          type={type}
          value={title}
          onChange={setTitle}
          label={label}
          autoFocus
          onCommit={r => onCommit(r)}
          onBlur={() => {}}
        />
      ) : (
        <>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel() }}
            placeholder={`title...`}
            className="w-full text-sm text-[#2d2a35] border-b border-[#e4dff0] pb-1 focus:outline-none focus:border-[#a89bc2] placeholder-[#c4b8d9] bg-transparent"
          />
          <ImagePicker imageUrl={imgUrl} onImageUrl={setImgUrl} />
        </>
      )}

      <div className="flex gap-2 pt-1">
        {mode === 'manual' && (
          <button
            onClick={commit}
            disabled={!title.trim()}
            className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
            style={{ background: accent }}
          >add</button>
        )}
        <button onClick={onCancel} className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors px-1">cancel</button>
      </div>
    </div>
  )
}

export default function CurrentlyShelf({ fieldDef, items = [], isOwn, accent, accentRgb, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const { label, emoji, hasSearch } = fieldDef
  const visible = (items || []).filter(Boolean)
  const isFood  = label === 'eating' || label === 'drinking'

  if (!isOwn && visible.length === 0) return null

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <p className="text-[13px]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: accent, letterSpacing: '-0.01em' }}>
            {label}
          </p>
        </div>
        {isOwn && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] transition-colors"
            style={{ fontFamily: 'var(--font-hand)', color: `rgba(${accentRgb}, 0.75)` }}
            onMouseEnter={e => e.currentTarget.style.color = accent}
            onMouseLeave={e => e.currentTarget.style.color = `rgba(${accentRgb}, 0.75)`}
          >+ add</button>
        )}
      </div>

      {/* cover row */}
      <div className="flex flex-wrap gap-3 pb-1">
        {visible.map((item, i) => (
          <CoverTile
            key={i}
            item={item}
            isOwn={isOwn}
            portrait={!isFood}
            onRemove={() => onRemove(i)}
          />
        ))}

        {/* placeholder dashed tile for empty owner shelf */}
        {isOwn && visible.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 w-20 h-[7rem] rounded-xl border-2 border-dashed flex items-center justify-center text-2xl transition-colors"
            style={{ borderColor: `rgba(${accentRgb}, 0.2)`, color: `rgba(${accentRgb}, 0.3)` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.2)`; e.currentTarget.style.color = `rgba(${accentRgb}, 0.3)` }}
          >+</button>
        )}
      </div>

      {/* add form — outside overflow row so dropdown isn't clipped */}
      {isOwn && adding && (
        <ManualAddForm
          type={label}
          label={label}
          accent={accent}
          accentRgb={accentRgb}
          showSearch={hasSearch}
          onCommit={item => { onAdd(item); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}
