import React, { KeyboardEvent, useCallback, useRef } from 'react';

interface Props {
  running: boolean;
  fontSize: number;
  history: string[];
  onSend: (cmd: string) => void;
  onClear: () => void;
  onOpenSearch: () => void;
}

export function ConsoleInput({ running, fontSize, history, onSend, onClear, onOpenSearch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');
  const [historyIdx, setHistoryIdx] = React.useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = value.trim();
        if (!cmd || !running) return;
        onSend(cmd);
        setValue('');
        setHistoryIdx(-1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const n = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(n);
        setValue(history[n] ?? '');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const n = Math.max(historyIdx - 1, -1);
        setHistoryIdx(n);
        setValue(n === -1 ? '' : (history[n] ?? ''));
        return;
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        onClear();
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        onOpenSearch();
      }
    },
    [value, running, history, historyIdx, onSend, onClear, onOpenSearch]
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-surface-border bg-base-900 shrink-0">
      <span className="text-text-muted font-mono text-xs">›</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!running}
        placeholder={
          running
            ? 'Send command... (↑/↓ history, Ctrl+L clear, Ctrl+F search)'
            : 'Start the process to send commands'
        }
        className="flex-1 bg-transparent text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-40"
        style={{ fontSize }}
      />
    </div>
  );
}
