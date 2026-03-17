import React from 'react'
import { Button } from './Button'

interface Props {
  open: boolean; title: string; message: string
  confirmLabel?: string; danger?: boolean
  onConfirm: () => void; onCancel: () => void
}

export function Dialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="bg-base-900 border border-surface-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
