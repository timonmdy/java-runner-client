import { useState } from 'react';
import { VscClose } from 'react-icons/vsc';
import { useInputContextMenu } from '../../../hooks/useInputContextMenu';
import { Button } from '../inputs/Button';
import { Checkbox } from '../inputs/Checkbox';

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
            <Checkbox checked={item.enabled} onChange={() => toggle(i)} />
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
              <VscClose size={12} />
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
