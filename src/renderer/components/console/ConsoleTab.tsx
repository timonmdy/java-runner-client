import React, { useRef, useEffect, useState, useCallback, useMemo, KeyboardEvent } from 'react';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/Button';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';
import {
  VscSearch,
  VscChevronUp,
  VscChevronDown,
  VscClose,
  VscFolderOpened,
  VscClearAll,
} from 'react-icons/vsc';
import { ConsoleLine } from '../../../main/shared/types/Process.types';
import { hasJarConfigured } from '../../../main/shared/types/Profile.types';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString('en-GB', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

export function ConsoleTab() {
  const {
    state,
    activeProfile,
    startProcess,
    stopProcess,
    forceStopProcess,
    sendInput,
    clearConsole,
    isRunning,
  } = useApp();
  const { t } = useTranslation();

  const profileId = activeProfile?.id ?? '';
  const running = isRunning(profileId);
  const lines = state.consoleLogs[profileId] ?? [];
  const settings = state.settings;
  const processState = state.processStates.find((s) => s.profileId === profileId);
  const pid = processState?.pid;

  const [color, setColor] = useState(activeProfile?.color ?? '#4ade80');
  const [inputValue, setInputValue] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(0);
  const [lineCtxMenu, setLineCtxMenu] = useState<{ x: number; y: number; text: string } | null>(
    null
  );
  const { onContextMenu: inputContextMenu, contextMenu: inputCtxMenuEl } = useInputContextMenu();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setInputValue('');
    setHistoryIdx(-1);
    setErrorMsg(null);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIdx(0);
    setColor(activeProfile?.color ?? '#4ade80');
  }, [profileId]);

  useEffect(() => {
    setColor(activeProfile?.color ?? '#4ade80');
    console.log(activeProfile?.color);
  }, [activeProfile]);

  useEffect(() => {
    if (autoScroll && !searchOpen) bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lines.length, autoScroll, searchOpen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

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

  const scrollToMatch = useCallback((idx: number) => {
    const el = matchRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  useEffect(() => {
    if (matchIndices.length > 0) scrollToMatch(clampedIdx);
  }, [clampedIdx, matchIndices, scrollToMatch]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setAutoScroll(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIdx(0);
    setAutoScroll(true);
  }, []);

  const goNext = useCallback(() => setSearchIdx((i) => i + 1), []);
  const goPrev = useCallback(() => setSearchIdx((i) => i - 1), []);

  const handleToggle = useCallback(async () => {
    if (!activeProfile) return;
    setErrorMsg(null);
    if (running) {
      await stopProcess(profileId);
    } else {
      if (!hasJarConfigured(activeProfile)) {
        setErrorMsg(t('console.noJar'));
        return;
      }
      setStarting(true);
      const res = await startProcess(activeProfile);
      setStarting(false);
      if (!res.ok) setErrorMsg(res.error ?? 'Failed to start');
    }
  }, [activeProfile, running, profileId, stopProcess, startProcess, t]);

  const handleForceStop = useCallback(async () => {
    if (!profileId) return;
    await forceStopProcess(profileId);
  }, [profileId, forceStopProcess]);

  const handleOpenWorkDir = useCallback(async () => {
    if (!profileId) return;
    await window.api.openWorkingDir(profileId);
  }, [profileId]);

  const handleSend = useCallback(async () => {
    const cmd = inputValue.trim();
    if (!cmd || !running) return;
    await sendInput(profileId, cmd);
    setCmdHistory((prev) =>
      [cmd, ...prev.filter((c) => c !== cmd)].slice(0, settings?.consoleHistorySize ?? 200)
    );
    setInputValue('');
    setHistoryIdx(-1);
  }, [inputValue, running, profileId, sendInput, settings]);

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
        setInputValue(cmdHistory[n] ?? '');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const n = Math.max(historyIdx - 1, -1);
        setHistoryIdx(n);
        setInputValue(n === -1 ? '' : (cmdHistory[n] ?? ''));
        return;
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        clearConsole(profileId);
      }
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        openSearch();
      }
    },
    [handleSend, historyIdx, cmdHistory, clearConsole, profileId, openSearch]
  );

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && searchOpen) closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch, closeSearch, searchOpen]);

  const handleLineContextMenu = useCallback((e: React.MouseEvent, text: string) => {
    e.preventDefault();
    setLineCtxMenu({ x: e.clientX, y: e.clientY, text });
  }, []);

  const fontSize = settings?.consoleFontSize ?? 13;
  const wordWrap = settings?.consoleWordWrap ?? false;
  const lineNums = settings?.consoleLineNumbers ?? false;
  const showTimestamps = settings?.consoleTimestamps ?? false;

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        {t('general.noProfileSelected')}
      </div>
    );
  }

  matchRefs.current = new Array(matchIndices.length).fill(null);

  const lineCtxItems: ContextMenuItem[] = lineCtxMenu
    ? [
        {
          label: t('console.copyLine'),
          onClick: () => navigator.clipboard.writeText(lineCtxMenu.text),
        },
        {
          label: t('console.copyAll'),
          onClick: () => navigator.clipboard.writeText(lines.map((l) => l.text).join('\n')),
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-base-900 shrink-0">
        <Button
          variant={running ? 'danger' : 'custom'}
          size="sm"
          onClick={handleToggle}
          loading={starting}
          style={!running ? { backgroundColor: color, color: '#08090d', borderColor: color } : {}}
        >
          {running ? t('console.stop') : t('console.run')}
        </Button>

        {running && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceStop}
            title={t('console.forceKillHint')}
          >
            {t('console.forceKill')}
          </Button>
        )}

        {running && pid && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted animate-fade-in">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{ backgroundColor: color }}
            />
            PID <span className="text-text-secondary">{pid}</span>
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={handleOpenWorkDir}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          title={t('console.openWorkDir')}
        >
          <VscFolderOpened size={13} />
        </button>

        {!autoScroll && !searchOpen && (
          <button
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-mono transition-colors"
            style={{ color }}
          >
            {t('console.scrollToBottom')}
          </button>
        )}

        <button
          onClick={openSearch}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          title={t('console.search')}
        >
          <VscSearch size={13} />
        </button>

        <button
          onClick={() => clearConsole(profileId)}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          title={t('console.clear')}
        >
          <VscClearAll size={13} />
        </button>

        <span className="text-xs text-text-muted font-mono tabular-nums ml-1">
          {lines.length.toLocaleString()} {t('console.lines')}
        </span>
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? goPrev() : goNext();
              }
              if (e.key === 'Escape') closeSearch();
            }}
            onContextMenu={inputContextMenu}
            placeholder={t('console.searchPlaceholder')}
            className="flex-1 bg-base-950 border border-surface-border rounded-md px-2.5 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
            style={{ fontSize: Math.max(fontSize - 1, 11) }}
          />
          <span className="text-xs text-text-muted font-mono tabular-nums whitespace-nowrap">
            {matchIndices.length > 0
              ? `${clampedIdx + 1}/${matchIndices.length}`
              : searchTerm
                ? t('console.noMatches')
                : ''}
          </span>
          <button
            onClick={goPrev}
            className="text-text-muted hover:text-text-primary p-0.5"
            disabled={matchIndices.length === 0}
          >
            <VscChevronUp size={14} />
          </button>
          <button
            onClick={goNext}
            className="text-text-muted hover:text-text-primary p-0.5"
            disabled={matchIndices.length === 0}
          >
            <VscChevronDown size={14} />
          </button>
          <button onClick={closeSearch} className="text-text-muted hover:text-text-primary p-0.5">
            <VscClose size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="px-3 py-1.5 border-b border-surface-border bg-red-500/10 text-xs text-red-400 font-mono animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-base-950 select-text"
        style={{ fontSize }}
      >
        <div className={wordWrap ? 'py-2' : 'py-2 min-w-max'}>
          {lines.length === 0 && (
            <div className="px-4 py-8 text-center text-text-muted text-xs font-mono">
              {running ? t('console.waiting') : t('console.notRunning')}
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
                showLineNum={lineNums}
                showTimestamp={showTimestamps}
                wordWrap={wordWrap}
                searchTerm={searchTerm}
                isCurrentMatch={isCurrentMatch}
                isAnyMatch={isAnyMatch}
                onContextMenu={handleLineContextMenu}
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

      <div className="flex items-center gap-2 px-3 py-2 border-t border-surface-border bg-base-900 shrink-0">
        <span className="text-text-muted font-mono text-xs">&rsaquo;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onContextMenu={inputContextMenu}
          disabled={!running}
          placeholder={running ? t('console.inputPlaceholder') : t('console.inputDisabled')}
          className="flex-1 bg-transparent text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-40"
          style={{ fontSize }}
        />
      </div>

      {lineCtxMenu && lineCtxItems.length > 0 && (
        <ContextMenu
          x={lineCtxMenu.x}
          y={lineCtxMenu.y}
          items={lineCtxItems}
          onClose={() => setLineCtxMenu(null)}
        />
      )}
      {inputCtxMenuEl}
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
    showTimestamp: boolean;
    wordWrap: boolean;
    searchTerm: string;
    isCurrentMatch: boolean;
    isAnyMatch: boolean;
    onContextMenu: (e: React.MouseEvent, text: string) => void;
  }
>(
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
