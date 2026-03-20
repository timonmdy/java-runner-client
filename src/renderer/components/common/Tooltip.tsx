import React, { useState, useRef, useEffect } from 'react'

interface Props {
  content: React.ReactNode
  children: React.ReactElement
  delay?: number
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, delay = 400, side = 'top' }: Props) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const show = (e: React.MouseEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    targetRef.current = e.currentTarget as HTMLElement
    timerRef.current = setTimeout(() => {
      const tip = tipRef.current
      const tw = tip?.offsetWidth ?? 0
      const th = tip?.offsetHeight ?? 0
      let x = 0
      let y = 0
      if (side === 'top') {
        x = rect.left + rect.width / 2 - tw / 2
        y = rect.top - th - 6
      }
      if (side === 'bottom') {
        x = rect.left + rect.width / 2 - tw / 2
        y = rect.bottom + 6
      }
      if (side === 'left') {
        x = rect.left - tw - 6
        y = rect.top + rect.height / 2 - th / 2
      }
      if (side === 'right') {
        x = rect.right + 6
        y = rect.top + rect.height / 2 - th / 2
      }
      // Clamp to viewport
      x = Math.max(6, Math.min(window.innerWidth - tw - 6, x))
      y = Math.max(6, Math.min(window.innerHeight - th - 6, y))
      setPos({ x, y })
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  // Recalculate position when tip dimensions are known
  useEffect(() => {
    if (!visible || !targetRef.current) return
    const rect = targetRef.current.getBoundingClientRect()
    const tip = tipRef.current
    if (!tip) return
    const tw = tip.offsetWidth
    const th = tip.offsetHeight
    let x = 0
    let y = 0
    if (side === 'top') {
      x = rect.left + rect.width / 2 - tw / 2
      y = rect.top - th - 6
    }
    if (side === 'bottom') {
      x = rect.left + rect.width / 2 - tw / 2
      y = rect.bottom + 6
    }
    if (side === 'left') {
      x = rect.left - tw - 6
      y = rect.top + rect.height / 2 - th / 2
    }
    if (side === 'right') {
      x = rect.right + 6
      y = rect.top + rect.height / 2 - th / 2
    }
    x = Math.max(6, Math.min(window.innerWidth - tw - 6, x))
    y = Math.max(6, Math.min(window.innerHeight - th - 6, y))
    setPos({ x, y })
  }, [visible, side])

  const child = React.cloneElement(children, {
    onMouseEnter: show,
    onMouseLeave: hide,
  })

  return (
    <>
      {child}
      <div
        ref={tipRef}
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, pointerEvents: 'none' }}
        className={[
          'bg-base-900 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-text-secondary shadow-xl',
          'transition-opacity duration-150',
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {content}
      </div>
    </>
  )
}
