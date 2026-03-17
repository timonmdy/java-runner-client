import React from 'react'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  hint?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, hint, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'group flex items-start gap-3 text-left disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none',
      ].join(' ')}
    >
      {/* Track */}
      <div className={[
        'relative mt-0.5 w-9 h-5 rounded-full transition-colors duration-200 shrink-0',
        checked ? 'bg-accent shadow-glow-sm' : 'bg-surface-border',
      ].join(' ')}>
        {/* Knob */}
        <div className={[
          'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm',
          'transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}/>
      </div>
      {(label || hint) && (
        <div>
          {label && <p className="text-sm text-text-primary leading-5">{label}</p>}
          {hint  && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
        </div>
      )}
    </button>
  )
}
