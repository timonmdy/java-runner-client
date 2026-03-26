import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { ConsoleLine } from '../../../main/shared/types/Process.types';
import { parseAnsi, hasAnsi, AnsiSpan } from '../../utils/ansi';

interface Props {
  lines: ConsoleLine[];
  fontSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  searchOpen: boolean;
  searchQuery: string;
  searchIdx: number;
  onSearchIdxChange: (idx: number) => void;
  onAutoScrollChange: (v: boolean) => void;
  autoScroll: boolean;
}

export function ConsoleOutput({
  lines,
  fontSize,
  wordWrap,
  lineNumbers,
  searchOpen,
  searchQuery,
  searchIdx,
  onSearchIdxChange,
  onAutoScrollChange,
  autoScroll,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLDivElement | null)[]>([]);

  const searchTerm = searchQuery.trim().toLowerCase();

  const matchIndices = useMemo<number[]>(() => {
    if (!searchTerm) return [];
    return lines.reduce<number[]>((acc, line, i) => {
      if (line.text.toLowerCase().includes(searchTerm)) acc.push(i);
      return acc;
    }, []);
  }, [lines, searchTerm]);

  const clampedIdx =
    matchIndices.length > 0
      ? ((searchIdx % matchIndices.length) + matchIndices.length) % matchIndices.length
      : 0;

  useEffect(() => {
    if (autoScroll && !searchOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [lines.length, autoScroll, searchOpen]);

  useEffect(() => {
    if (matchIndices.length > 0) {
      matchRefs.current[clampedIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clampedIdx, matchIndices.length]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    onAutoScrollChange(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, [onAutoScrollChange]);

  matchRefs.current = new Array(matchIndices.length).fill(null);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-base-950 select-text"
      style={{ fontSize, lineHeight: 1.6, fontFamily: 'monospace' }}
    >
      <div className={wordWrap ? 'py-2' : 'py-2 min-w-max'}>
        {lines.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-xs font-mono">
            Process not running. Press Run to start.
          </div>
        )}
        {lines.map((line, i) => {
          const matchPos = matchIndices.indexOf(i);
          const isCurrentMatch = matchPos === clampedIdx && matchPos !== -1;
          const isAnyMatch = matchPos !== -1;
          return (
            <ConsoleLineRow
              key={line.id}
              line={line}
              lineNum={i + 1}
              showLineNum={lineNumbers}
              wordWrap={wordWrap}
              searchTerm={searchTerm}
              isCurrentMatch={isCurrentMatch}
              isAnyMatch={isAnyMatch}
              ref={
                matchPos !== -1
                  ? (el: HTMLDivElement | null) => {
                      matchRefs.current[matchPos] = el;
                    }
                  : undefined
              }
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Line row ─────────────────────────────────────────────────────────────────

const LINE_COLORS: Record<ConsoleLine['type'], string> = {
  stdout: 'text-text-primary',
  stderr: 'text-console-error',
  input: 'text-console-input',
  system: 'text-text-muted',
};

const ConsoleLineRow = React.forwardRef<
  HTMLDivElement,
  {
    line: ConsoleLine;
    lineNum: number;
    showLineNum: boolean;
    wordWrap: boolean;
    searchTerm: string;
    isCurrentMatch: boolean;
    isAnyMatch: boolean;
  }
>(({ line, lineNum, showLineNum, wordWrap, searchTerm, isCurrentMatch, isAnyMatch }, ref) => {
  const text = line.text || ' ';

  return (
    <div
      ref={ref}
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
      <span
        className={[
          'font-mono flex-1',
          wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
        ].join(' ')}
      >
        {renderContent(text, searchTerm, isCurrentMatch, isAnyMatch)}
      </span>
    </div>
  );
});
ConsoleLineRow.displayName = 'ConsoleLineRow';

function renderContent(
  text: string,
  searchTerm: string,
  isCurrentMatch: boolean,
  isAnyMatch: boolean
): React.ReactNode {
  if (hasAnsi(text)) {
    const spans = parseAnsi(text);
    if (!searchTerm || !isAnyMatch) {
      return spans.map((span, i) => <AnsiSpanNode key={i} span={span} />);
    }
    return spans.map((span, i) => (
      <AnsiSpanNode key={i} span={span} searchTerm={searchTerm} isCurrent={isCurrentMatch} />
    ));
  }

  if (searchTerm && isAnyMatch) {
    return renderHighlighted(text, searchTerm, isCurrentMatch);
  }

  return text;
}

function AnsiSpanNode({
  span,
  searchTerm,
  isCurrent,
}: {
  span: AnsiSpan;
  searchTerm?: string;
  isCurrent?: boolean;
}) {
  const style: React.CSSProperties = {};
  if (span.color) style.color = span.color;
  if (span.bgColor) style.backgroundColor = span.bgColor;
  if (span.bold) style.fontWeight = 'bold';
  if (span.dim) style.opacity = 0.6;
  if (span.italic) style.fontStyle = 'italic';
  if (span.underline) style.textDecoration = 'underline';

  const content =
    searchTerm && span.text.toLowerCase().includes(searchTerm.toLowerCase())
      ? renderHighlighted(span.text, searchTerm, isCurrent ?? false)
      : span.text;

  return <span style={Object.keys(style).length ? style : undefined}>{content}</span>;
}

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
