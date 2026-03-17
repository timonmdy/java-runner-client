/**
 * ContextMenu — right-click menu with disabled state and separator support.
 */
import React, { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label?:    string
  icon?:     React.ReactNode
  danger?:   boolean
  disabled?: boolean
  type?:     'separator'
  onClick?:  () => void
}

interface Props { x: number; y: number; items: ContextMenuItem[]; onClose: () => void }

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

  return (
    <div ref={ref} style={{ position: 'fixed', top: y, left: x, zIndex: 100 }}>
      <div className="bg-base-850 border border-surface-border rounded-lg shadow-panel py-1 min-w-[170px] animate-fade-in">
        {items.map((item, i) => {
          if (item.type === 'separator') {
            return <div key={i} className="my-1 border-t border-surface-border/70" />
          }
          return (
            <button key={i}
              disabled={item.disabled}
              onClick={() => { if (!item.disabled && item.onClick) { item.onClick(); onClose() } }}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
                item.disabled ? 'opacity-30 cursor-not-allowed' :
                item.danger   ? 'text-red-400 hover:bg-red-500/10' :
                                'text-text-primary hover:bg-surface-raised',
              ].join(' ')}>
              {item.icon && <span className="opacity-70 shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.disabled && item.danger && (
                <span className="text-xs text-text-muted ml-auto">(last)</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
