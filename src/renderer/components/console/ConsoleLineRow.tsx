import type { ConsoleLine } from '@shared/types/Process.types';
import React from 'react';

const LINE_COLORS: Record<ConsoleLine['type'], string> = {
  stdout: 'text-text-primary',
  stderr: 'text-console-error',
  input: 'text-console-input',
  system: 'text-text-muted',
};

interface Props {
  line: ConsoleLine;
  lineNum: number;
  showLineNum: boolean;
  showTimestamp: boolean;
  wordWrap: boolean;
  searchTerm: string;
  isCurrentMatch: boolean;
  isAnyMatch: boolean;
  onContextMenu: (e: React.MouseEvent, text: string) => void;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString('en-GB', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

export const ConsoleLineRow = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      line,
      lineNum,
      showLineNum,
      showTimestamp,
      wordWrap,
      searchTerm,
      isCurrentMatch,
      isAnyMatch,
      onContextMenu,
    },
    ref
  ) => {
    const text = line.text || ' ';
    const content =
      searchTerm && isAnyMatch ? renderHighlighted(text, searchTerm, isCurrentMatch) : text;

    return (
      <div
        ref={ref}
        onContextMenu={(e) => onContextMenu(e, line.text)}
        className={[
          'flex gap-0 px-2',
          LINE_COLORS[line.type],
          isCurrentMatch
            ? 'bg-yellow-400/10'
            : isAnyMatch
              ? 'bg-yellow-400/5'
              : 'hover:bg-white/[0.02]',
        ].join(' ')}
      >
        {showLineNum && (
          <span className="w-10 shrink-0 text-right pr-3 text-text-muted/40 select-none font-mono text-[0.7em] leading-[1.6] pt-px">
            {lineNum}
          </span>
        )}
        {showTimestamp && (
          <span className="shrink-0 pr-3 text-text-muted/50 select-none font-mono text-[0.7em] leading-[1.6] pt-px">
            {formatTimestamp(line.timestamp)}
          </span>
        )}
        <span
          className={[
            'font-mono flex-1',
            wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
          ].join(' ')}
        >
          {content}
        </span>
      </div>
    );
  }
);
ConsoleLineRow.displayName = 'ConsoleLineRow';

function renderHighlighted(text: string, term: string, isCurrent: boolean): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let last = 0;
  let idx = lower.indexOf(term);
  let key = 0;

  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <mark
        key={key++}
        className={
          isCurrent
            ? 'bg-yellow-300 text-black rounded-sm'
            : 'bg-yellow-400/30 text-inherit rounded-sm'
        }
      >
        {text.slice(idx, idx + term.length)}
      </mark>
    );
    last = idx + term.length;
    idx = lower.indexOf(term, last);
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
