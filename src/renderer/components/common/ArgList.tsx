/**
 * ArgList — editable list of string arguments with enable/disable toggles.
 * Used for both JVM arguments and program arguments.
 */
import React, { useState } from 'react'
import { Button } from './Button'

export interface ArgItem {
  value:   string
  enabled: boolean
}

interface Props {
  items:       ArgItem[]
  onChange:    (items: ArgItem[]) => void
  onDraftChange?: (hasDraft: boolean) => void
  draft?:      string  // Controlled draft value (optional - if not provided, uses local state)
  onDraftUpdate?: (value: string) => void  // Callback when draft changes (for parent control)
  placeholder?: string
  addLabel?:   string
}

export function ArgList({
  items,
  onChange,
  onDraftChange,
  draft: controlledDraft,
  onDraftUpdate,
  placeholder = '--arg',
  addLabel    = 'Add argument',
}: Props) {
  const [localDraft, setLocalDraft] = useState('')
  // Use controlled draft if parent provides one, otherwise use local state
  const draft = controlledDraft !== undefined ? controlledDraft : localDraft

  const setDraft = (value: string) => {
    if (controlledDraft !== undefined) {
      // Controlled mode
      onDraftUpdate?.(value)
    } else {
      // Uncontrolled mode
      setLocalDraft(value)
    }
  }

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, { value: v, enabled: true }])
    setDraft('')
    onDraftChange?.(false)
  }

  const handleDraftChange = (value: string) => {
    setDraft(value)
    onDraftChange?.(value.trim().length > 0)
  }

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  const toggle = (i: number) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, enabled: !it.enabled } : it))

  const edit = (i: number, value: string) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, value } : it))

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          {/* Enabled toggle */}
          <button
            onClick={() => toggle(i)}
            title={item.enabled ? 'Disable' : 'Enable'}
            className={[
              'w-4 h-4 rounded border transition-colors shrink-0',
              item.enabled
                ? 'bg-accent border-accent'
                : 'bg-transparent border-surface-border hover:border-text-muted',
            ].join(' ')}
          >
            {item.enabled && (
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-full h-full text-base-950 p-0.5">
                <polyline points="2,5 4,7.5 8,2.5"/>
              </svg>
            )}
          </button>

          {/* Value */}
          <input
            type="text"
            value={item.value}
            onChange={e => edit(i, e.target.value)}
            className={[
              'flex-1 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5',
              'text-xs font-mono text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent/40 transition-colors',
              !item.enabled ? 'opacity-40 line-through' : '',
            ].join(' ')}
          />

          {/* Remove */}
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10"/>
              <line x1="10" y1="2" x2="2" y2="10"/>
            </svg>
          </button>
        </div>
      ))}

      {/* Add row */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={draft}
          onChange={e => handleDraftChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5
            text-xs font-mono text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent/40 transition-colors"
        />
        <Button variant="ghost" size="sm" onClick={add} disabled={!draft.trim()}>
          + Add
        </Button>
      </div>
    </div>
  )
}
