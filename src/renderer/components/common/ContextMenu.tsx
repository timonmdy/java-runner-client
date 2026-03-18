import React, { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label?:    string
  icon?:     React.ReactNode
  danger?:   boolean
  disabled?: boolean
  type?:     'separator'
  onClick?:  () => void
}

interface Props {
  x:       number
  y:       number
  items:   ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') { onClose(); return }
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  const style: React.CSSProperties = { position: 'fixed', zIndex: 1000 }
  if (x + 180 > window.innerWidth) style.right  = window.innerWidth - x
  else                              style.left   = x
  if (y + items.length * 32 > window.innerHeight) style.bottom = window.innerHeight - y
  else                                             style.top    = y

  return (
    <div ref={ref} style={style}>
      <div className="bg-base-900 border border-surface-border rounded-lg shadow-2xl py-1 min-w-[175px] animate-fade-in">
        {items.map((item, i) => {
          if (item.type === 'separator') {
            return <div key={i} className="my-1 border-t border-surface-border/60" />
          }
          return (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { if (!item.disabled && item.onClick) { item.onClick(); onClose() } }}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors',
                item.disabled ? 'opacity-30 cursor-not-allowed' :
                item.danger   ? 'text-red-400 hover:bg-red-500/10' :
                                'text-text-primary hover:bg-surface-raised',
              ].join(' ')}
            >
              {item.icon && <span className="opacity-70 shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
