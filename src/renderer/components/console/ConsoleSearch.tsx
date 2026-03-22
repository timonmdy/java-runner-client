import React, { useRef, useEffect } from 'react';
import { VscChevronUp, VscChevronDown, VscClose } from 'react-icons/vsc';

interface Props {
  query: string;
  matchCount: number;
  currentIdx: number;
  onQueryChange: (q: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function ConsoleSearch({
  query,
  matchCount,
  currentIdx,
  onQueryChange,
  onNext,
  onPrev,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.shiftKey ? onPrev() : onNext();
          }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Search console... (Enter next, Shift+Enter prev)"
        className="flex-1 bg-base-950 border border-surface-border rounded px-2.5 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40"
      />
      {query.trim() && (
        <span className="text-xs font-mono text-text-muted shrink-0">
          {matchCount === 0 ? 'No matches' : `${currentIdx + 1} / ${matchCount}`}
        </span>
      )}
      <button
        onClick={onPrev}
        disabled={matchCount === 0}
        className="text-text-muted hover:text-text-primary disabled:opacity-30 p-0.5"
        title="Previous (Shift+Enter)"
      >
        <VscChevronUp size={13} />
      </button>
      <button
        onClick={onNext}
        disabled={matchCount === 0}
        className="text-text-muted hover:text-text-primary disabled:opacity-30 p-0.5"
        title="Next (Enter)"
      >
        <VscChevronDown size={13} />
      </button>
      <button
        onClick={onClose}
        className="text-text-muted hover:text-text-primary p-0.5"
        title="Close (Esc)"
      >
        <VscClose size={13} />
      </button>
    </div>
  );
}
