import React from 'react'

interface Props {
  checked:   boolean
  onChange:  (v: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex w-9 h-5 rounded-full border-2 transition-colors duration-200',
        'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
        checked ? 'bg-accent border-accent' : 'bg-transparent border-surface-border',
      ].join(' ')}
    >
      <span className={[
        'inline-block w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 mt-px',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      ].join(' ')} />
    </button>
  )
}
