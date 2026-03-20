import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({
  variant = 'ghost',
  size = 'sm',
  loading = false,
  children,
  disabled,
  className = '',
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md border font-mono transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-sm' }
  const variants = {
    primary: 'bg-accent border-accent text-base-950 hover:brightness-110',
    ghost:
      'bg-transparent border-surface-border text-text-secondary hover:text-text-primary hover:border-text-muted',
    danger: 'bg-transparent border-red-500/30 text-red-400 hover:border-red-400 hover:text-red-300',
  }
  return (
    <button
      disabled={disabled || loading}
      className={[base, sizes[size], variants[variant], className].join(' ')}
      {...rest}
    >
      {loading ? <span className="opacity-60">...</span> : children}
    </button>
  )
}
