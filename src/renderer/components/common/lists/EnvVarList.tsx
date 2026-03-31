import type { EnvVariable } from '@shared/types/Profile.types';
import React, { useRef, useState } from 'react';
import { VscAdd, VscTrash } from 'react-icons/vsc';
import { useInputContextMenu } from '../../../hooks/useInputContextMenu';
import { Toggle } from '../inputs/Toggle';

interface Props {
  items: EnvVariable[];
  onChange: (items: EnvVariable[]) => void;
  onPendingChange?: (pending: boolean) => void;
}

export function EnvVarList({ items, onChange, onPendingChange }: Props) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const keyRef = useRef<HTMLInputElement>(null);
  const { onContextMenu, contextMenu } = useInputContextMenu();

  const hasPending = newKey.trim().length > 0 || newValue.trim().length > 0;

  const handleAdd = () => {
    if (!newKey.trim()) return;
    onChange([...items, { key: newKey.trim(), value: newValue, enabled: true }]);
    setNewKey('');
    setNewValue('');
    onPendingChange?.(false);
    keyRef.current?.focus();
  };

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleToggle = (idx: number, enabled: boolean) => {
    const next = [...items];
    next[idx] = { ...next[idx], enabled };
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className={[
              'flex items-center gap-2 rounded-lg border px-3 py-2',
              item.enabled
                ? 'border-surface-border bg-base-900'
                : 'border-surface-border/50 bg-base-900/30 opacity-60',
            ].join(' ')}
          >
            <Toggle checked={item.enabled} onChange={(v) => handleToggle(i, v)} />
            <code className="text-xs font-mono text-accent min-w-0 truncate">{item.key}</code>
            <span className="text-xs text-text-muted">=</span>
            <code className="text-xs font-mono text-text-secondary flex-1 min-w-0 truncate">
              {item.value}
            </code>
            <button
              onClick={() => handleRemove(i)}
              className="text-text-muted hover:text-red-400 transition-colors shrink-0"
            >
              <VscTrash size={12} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <input
            ref={keyRef}
            type="text"
            value={newKey}
            onChange={(e) => {
              setNewKey(e.target.value);
              onPendingChange?.(e.target.value.trim().length > 0 || newValue.trim().length > 0);
            }}
            onKeyDown={handleKeyDown}
            onContextMenu={onContextMenu}
            placeholder="KEY"
            className="w-28 bg-base-950 border border-surface-border rounded px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
          />
          <span className="text-xs text-text-muted">=</span>
          <input
            type="text"
            value={newValue}
            onChange={(e) => {
              setNewValue(e.target.value);
              onPendingChange?.(newKey.trim().length > 0 || e.target.value.trim().length > 0);
            }}
            onKeyDown={handleKeyDown}
            onContextMenu={onContextMenu}
            placeholder="value"
            className="flex-1 bg-base-950 border border-surface-border rounded px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
          />
          <button
            onClick={handleAdd}
            disabled={!newKey.trim()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-surface-border text-xs font-mono text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <VscAdd size={11} /> Add
          </button>
        </div>
      </div>
      {contextMenu}
    </>
  );
}
