import React, { type InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, rightElement, className = '', ...rest },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={[
            'w-full bg-base-900 border border-surface-border rounded-lg px-3 py-2',
            'text-sm text-text-primary placeholder:text-text-muted font-mono',
            'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
            'transition-colors duration-150',
            error ? 'border-red-500/50' : '',
            rightElement ? 'pr-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {hint  && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})
