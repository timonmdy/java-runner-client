import React, { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-accent text-base-950 font-semibold hover:bg-accent-glow shadow-glow-sm',
  secondary: 'bg-surface-raised text-text-primary border border-surface-border hover:bg-surface-hover',
  ghost:     'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
  danger:    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2   text-sm rounded-lg gap-2',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed font-sans',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V0a12 12 0 100 24v-4l-3 3 3 3V24A12 12 0 014 12z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
