import { useState } from 'react'

export default function DeleteButton({ onDelete, label = 'delete', className = '' }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-[#a89bc2]">sure?</span>
      <button
        onClick={onDelete}
        className="text-xs text-rose-300 hover:text-rose-400 transition-colors"
      >
        yes
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-[#c4b8d9] hover:text-[#a89bc2] transition-colors"
      >
        no
      </button>
    </span>
  )

  return (
    <button onClick={() => setConfirming(true)} className={className}>
      {label}
    </button>
  )
}
