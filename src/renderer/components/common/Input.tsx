import React from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  rightElement?: React.ReactNode
}

export function Input({ label, hint, rightElement, className = '', ...rest }: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-mono text-text-muted uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5 focus-within:border-accent/40 transition-colors">
        <input
          className={[
            'flex-1 bg-transparent text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightElement}
      </div>
      {hint && <p className="text-xs text-text-muted/70">{hint}</p>}
    </div>
  )
}
