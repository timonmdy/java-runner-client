import { KeyboardEvent, useCallback, useRef, useState } from 'react';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';
import { useTranslation } from '../../i18n/I18nProvider';

interface Props {
  running: boolean;
  fontSize: number;
  onSend: (cmd: string) => void;
  onClear: () => void;
  onOpenSearch: () => void;
  historySize: number;
}

export function ConsoleInput({
  running,
  fontSize,
  onSend,
  onClear,
  onOpenSearch,
  historySize,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const { onContextMenu, contextMenu } = useInputContextMenu();

  const handleSend = useCallback(() => {
    const cmd = value.trim();
    if (!cmd || !running) return;
    onSend(cmd);
    setCmdHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)].slice(0, historySize));
    setValue('');
    setHistoryIdx(-1);
  }, [value, running, onSend, historySize]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const n = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(n);
        setValue(cmdHistory[n] ?? '');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const n = Math.max(historyIdx - 1, -1);
        setHistoryIdx(n);
        setValue(n === -1 ? '' : (cmdHistory[n] ?? ''));
        return;
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        onClear();
      }
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        onOpenSearch();
      }
    },
    [handleSend, historyIdx, cmdHistory, onClear, onOpenSearch]
  );

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-surface-border bg-base-900 shrink-0">
        <span className="text-text-muted font-mono text-xs">&rsaquo;</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onContextMenu={onContextMenu}
          disabled={!running}
          placeholder={running ? t('console.inputPlaceholder') : t('console.inputDisabled')}
          className="flex-1 bg-transparent text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-40"
          style={{ fontSize }}
        />
      </div>
      {contextMenu}
    </>
  );
}
