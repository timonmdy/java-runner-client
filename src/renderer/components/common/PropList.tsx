/**
 * PropList — editable list of key=value system properties.
 * Each row maps to a -Dkey=value JVM flag.
 */
import React, { useState } from 'react'
import { Button } from './Button'

export interface PropItem {
  key:     string
  value:   string
  enabled: boolean
}

interface Props {
  items:    PropItem[]
  onChange: (items: PropItem[]) => void
  onDraftChange?: (hasDraft: boolean) => void
  draftKey?: string
  draftValue?: string
  onDraftUpdate?: (key: string, value: string) => void
}

export function PropList({ 
  items, 
  onChange, 
  onDraftChange,
  draftKey: controlledDraftKey,
  draftValue: controlledDraftValue,
  onDraftUpdate
}: Props) {
  const [localDraftKey, setLocalDraftKey]     = useState('')
  const [localDraftValue, setLocalDraftValue] = useState('')
  
  // Use controlled values if parent provides them, otherwise use local state
  const draftKey = controlledDraftKey !== undefined ? controlledDraftKey : localDraftKey
  const draftValue = controlledDraftValue !== undefined ? controlledDraftValue : localDraftValue

  const handleDraftKeyChange = (newKey: string) => {
    if (controlledDraftKey !== undefined) {
      onDraftUpdate?.(newKey, draftValue)
    } else {
      setLocalDraftKey(newKey)
    }
    onDraftChange?.(newKey.trim().length > 0)
  }

  const handleDraftValueChange = (newValue: string) => {
    if (controlledDraftValue !== undefined) {
      onDraftUpdate?.(draftKey, newValue)
    } else {
      setLocalDraftValue(newValue)
    }
    // Trigger on draft change when key is non-empty
    onDraftChange?.(draftKey.trim().length > 0)
  }

  const add = () => {
    if (!draftKey.trim()) return
    onChange([...items, { key: draftKey.trim(), value: draftValue.trim(), enabled: true }])
    if (controlledDraftKey !== undefined) {
      onDraftUpdate?.('', '')
    } else {
      setLocalDraftKey('')
      setLocalDraftValue('')
    }
    onDraftChange?.(false)
  }

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  const toggle = (i: number) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, enabled: !it.enabled } : it))

  const editKey   = (i: number, key: string)   => onChange(items.map((it, idx) => idx === i ? { ...it, key }   : it))
  const editValue = (i: number, value: string) => onChange(items.map((it, idx) => idx === i ? { ...it, value } : it))

  return (
    <div className="space-y-1.5">
      {/* Column headers */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 px-6">
          <span className="flex-1 text-xs text-text-muted font-mono uppercase tracking-wider">Key</span>
          <span className="flex-1 text-xs text-text-muted font-mono uppercase tracking-wider">Value</span>
          <div className="w-5"/>
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          {/* Enabled */}
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

          {/* Key */}
          <input
            type="text"
            value={item.key}
            onChange={e => editKey(i, e.target.value)}
            placeholder="property.key"
            className={[
              'flex-1 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5',
              'text-xs font-mono text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent/40 transition-colors',
              !item.enabled ? 'opacity-40' : '',
            ].join(' ')}
          />

          <span className="text-text-muted font-mono text-xs">=</span>

          {/* Value */}
          <input
            type="text"
            value={item.value}
            onChange={e => editValue(i, e.target.value)}
            placeholder="value (optional)"
            className={[
              'flex-1 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5',
              'text-xs font-mono text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent/40 transition-colors',
              !item.enabled ? 'opacity-40' : '',
            ].join(' ')}
          />

          {/* Remove */}
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 shrink-0"
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
        <div className="w-4 shrink-0"/>
        <input
          type="text"
          value={draftKey}
          onChange={e => handleDraftKeyChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="server.port"
          className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5
            text-xs font-mono text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent/40 transition-colors"
        />
        <span className="text-text-muted font-mono text-xs">=</span>
        <input
          type="text"
          value={draftValue}
          onChange={e => handleDraftValueChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="8080"
          className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5
            text-xs font-mono text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent/40 transition-colors"
        />
        <Button variant="ghost" size="sm" onClick={add} disabled={!draftKey.trim()}>
          + Add
        </Button>
      </div>
    </div>
  )
}
