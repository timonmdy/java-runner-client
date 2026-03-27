import React, { useState } from 'react';
import { Button } from './Button';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';

export interface ArgItem {
  value: string;
  enabled: boolean;
}

interface Props {
  items: ArgItem[];
  onChange: (items: ArgItem[]) => void;
  onPendingChange?: (hasPending: boolean) => void;
  placeholder?: string;
}

export function ArgList({ items, onChange, onPendingChange, placeholder = '--arg' }: Props) {
  const [draft, setDraft] = useState('');
  const { onContextMenu, contextMenu } = useInputContextMenu();

  const setDraftAndNotify = (v: string) => {
    setDraft(v);
    onPendingChange?.(v.trim().length > 0);
  };

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, { value: v, enabled: true }]);
    setDraft('');
    onPendingChange?.(false);
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const toggle = (i: number) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, enabled: !it.enabled } : it)));
  const edit = (i: number, value: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, value } : it)));

  return (
    <>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 group">
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
                <svg
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-full h-full text-base-950 p-0.5"
                >
                  <polyline points="2,5 4,7.5 8,2.5" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={item.value}
              onChange={(e) => edit(i, e.target.value)}
              onContextMenu={onContextMenu}
              className={[
                'flex-1 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors',
                !item.enabled ? 'opacity-40 line-through' : '',
              ].join(' ')}
            />
            <button
              onClick={() => remove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraftAndNotify(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            onContextMenu={onContextMenu}
            placeholder={placeholder}
            className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
          <Button variant="ghost" size="sm" onClick={add} disabled={!draft.trim()}>
            + Add
          </Button>
        </div>
      </div>
      {contextMenu}
    </>
  );
}
