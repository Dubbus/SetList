import { useState } from 'react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <div className={`flex gap-0.5 ${readonly ? 'pointer-events-none' : ''}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`${sizeClass} transition-all duration-100 ${
            readonly ? '' : 'hover:scale-110 active:scale-95'
          } leading-none focus:outline-none`}
        >
          <span className={star <= display ? 'text-gold-500' : 'text-stone-300'}>★</span>
        </button>
      ))}
    </div>
  )
}
