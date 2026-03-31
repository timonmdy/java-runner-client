import { useEffect, useRef } from 'react';
import { VscChevronDown, VscChevronUp, VscClose } from 'react-icons/vsc';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';
import { useTranslation } from '../../i18n/I18nProvider';

interface Props {
  query: string;
  matchCount: number;
  currentIdx: number;
  fontSize: number;
  onQueryChange: (q: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function ConsoleSearchBar({
  query,
  matchCount,
  currentIdx,
  fontSize,
  onQueryChange,
  onNext,
  onPrev,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);
  const { onContextMenu, contextMenu } = useInputContextMenu();

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.shiftKey ? onPrev() : onNext();
            }
            if (e.key === 'Escape') onClose();
          }}
          onContextMenu={onContextMenu}
          placeholder={t('console.searchPlaceholder')}
          className="flex-1 bg-base-950 border border-surface-border rounded-md px-2.5 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          style={{ fontSize: Math.max(fontSize - 1, 11) }}
        />
        <span className="text-xs text-text-muted font-mono tabular-nums whitespace-nowrap">
          {matchCount > 0
            ? `${currentIdx + 1}/${matchCount}`
            : query.trim()
              ? t('console.noMatches')
              : ''}
        </span>
        <button
          onClick={onPrev}
          className="text-text-muted hover:text-text-primary p-0.5"
          disabled={matchCount === 0}
        >
          <VscChevronUp size={14} />
        </button>
        <button
          onClick={onNext}
          className="text-text-muted hover:text-text-primary p-0.5"
          disabled={matchCount === 0}
        >
          <VscChevronDown size={14} />
        </button>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-0.5">
          <VscClose size={14} />
        </button>
      </div>
      {contextMenu}
    </>
  );
}
