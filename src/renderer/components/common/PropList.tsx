import React, { useState } from 'react';
import { Button } from './Button';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';

export interface PropItem {
  key: string;
  value: string;
  enabled: boolean;
}

interface Props {
  items: PropItem[];
  onChange: (items: PropItem[]) => void;
  onPendingChange?: (hasPending: boolean) => void;
}

export function PropList({ items, onChange, onPendingChange }: Props) {
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');
  const { onContextMenu, contextMenu } = useInputContextMenu();

  const notify = (k: string, v: string) =>
    onPendingChange?.(k.trim().length > 0 || v.trim().length > 0);

  const setKey = (v: string) => {
    setDraftKey(v);
    notify(v, draftValue);
  };
  const setVal = (v: string) => {
    setDraftValue(v);
    notify(draftKey, v);
  };

  const add = () => {
    if (!draftKey.trim()) return;
    onChange([...items, { key: draftKey.trim(), value: draftValue.trim(), enabled: true }]);
    setDraftKey('');
    setDraftValue('');
    onPendingChange?.(false);
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const toggle = (i: number) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, enabled: !it.enabled } : it)));
  const editKey = (i: number, key: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, key } : it)));
  const editValue = (i: number, value: string) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, value } : it)));

  const inputCls = (disabled?: boolean) =>
    [
      'flex-1 bg-base-900 border border-surface-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors',
      disabled ? 'opacity-40' : '',
    ].join(' ');

  return (
    <>
      <div className="space-y-1.5">
        {items.length > 0 && (
          <div className="flex items-center gap-2 px-6">
            <span className="flex-1 text-xs text-text-muted font-mono uppercase tracking-wider">
              Key
            </span>
            <span className="flex-1 text-xs text-text-muted font-mono uppercase tracking-wider">
              Value
            </span>
            <div className="w-5" />
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(i)}
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
              value={item.key}
              onChange={(e) => editKey(i, e.target.value)}
              onContextMenu={onContextMenu}
              placeholder="property.key"
              className={inputCls(!item.enabled)}
            />
            <span className="text-text-muted font-mono text-xs">=</span>
            <input
              type="text"
              value={item.value}
              onChange={(e) => editValue(i, e.target.value)}
              onContextMenu={onContextMenu}
              placeholder="value (optional)"
              className={inputCls(!item.enabled)}
            />
            <button
              onClick={() => remove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 shrink-0"
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
          <div className="w-4 shrink-0" />
          <input
            type="text"
            value={draftKey}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            onContextMenu={onContextMenu}
            placeholder="server.port"
            className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
          <span className="text-text-muted font-mono text-xs">=</span>
          <input
            type="text"
            value={draftValue}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            onContextMenu={onContextMenu}
            placeholder="8080"
            className="flex-1 bg-base-900 border border-dashed border-surface-border rounded-md px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
          <Button variant="ghost" size="sm" onClick={add} disabled={!draftKey.trim()}>
            + Add
          </Button>
        </div>
      </div>
      {contextMenu}
    </>
  );
}
