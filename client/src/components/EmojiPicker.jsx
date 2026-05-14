import { useEffect, useRef, useState } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

export default function EmojiPicker({ value, onChange, placeholder = '✦' }) {
  const [open, setOpen] = useState(false)
  const [flipRight, setFlipRight] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const pickerWidth = window.innerWidth < 500 ? 260 : 352
      setFlipRight(rect.left + pickerWidth > window.innerWidth - 10)
    }
  }, [open])

  const perLine = window.innerWidth < 500 ? 6 : 8

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors hover:bg-[#f0ecfa]"
        style={{ background: open ? '#ede9f5' : 'transparent' }}
        title="pick an emoji"
      >
        {value || placeholder}
      </button>

      {open && (
        <div className={`absolute z-50 top-11 ${flipRight ? 'right-0' : 'left-0'}`}>
          <Picker
            data={data}
            onEmojiSelect={(e) => { onChange(e.native); setOpen(false) }}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            set="native"
            perLine={perLine}
          />
        </div>
      )}
    </div>
  )
}
