/**
 * Dialog — in-app styled modal. Replaces native browser confirm().
 * Usage: <Dialog open={open} title="..." onConfirm={...} onCancel={...} />
 */
import React from 'react'
import { Button } from './Button'

interface Props {
  open:          boolean
  title:         string
  message?:      string
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
  hideCancel?:   boolean
  onConfirm:     () => void
  onCancel:      () => void
}

export function Dialog({
  open, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, hideCancel = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        className="bg-base-850 border border-surface-border rounded-xl shadow-panel w-full max-w-sm mx-4 p-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-1">{title}</h2>
        {message && <p className="text-xs text-text-secondary leading-relaxed mb-5">{message}</p>}

        <div className="flex justify-end gap-2 mt-4">
          {!hideCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          )}
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
