import { hasJarConfigured } from '@shared/types/Profile.types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscCopy } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { ContextMenu, ContextMenuItem } from '../common/overlays';
import { ConsoleInput } from './ConsoleInput';
import { ConsoleLineRow } from './ConsoleLineRow';
import { ConsoleSearchBar } from './ConsoleSearchBar';
import { ConsoleToolbar } from './ConsoleToolbar';

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
  const pid = state.processStates.find((s) => s.profileId === profileId)?.pid;
  const color = activeProfile?.color ?? '#4ade80';

  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(0);

  // Context menu state
  const [lineCtxMenu, setLineCtxMenu] = useState<{ x: number; y: number; text: string } | null>(
    null
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset state on profile change
  useEffect(() => {
    setErrorMsg(null);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIdx(0);
  }, [profileId]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && !searchOpen) bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lines.length, autoScroll, searchOpen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  // Search logic
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
    if (matchIndices.length > 0) {
      matchRefs.current[clampedIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [clampedIdx, matchIndices]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setAutoScroll(false);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIdx(0);
    setAutoScroll(true);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && searchOpen) closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch, closeSearch, searchOpen]);

  // Process actions
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
    if (profileId) await forceStopProcess(profileId);
  }, [profileId, forceStopProcess]);

  const handleOpenWorkDir = useCallback(async () => {
    if (profileId) await jrc.api.openWorkingDir(profileId);
  }, [profileId]);

  const handleSendInput = useCallback(
    async (cmd: string) => {
      await sendInput(profileId, cmd);
    },
    [profileId, sendInput]
  );

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
          icon: <VscCopy size={12} />,
          onClick: () => navigator.clipboard.writeText(lineCtxMenu.text),
        },
        {
          label: t('console.copyAll'),
          icon: <VscCopy size={12} />,
          onClick: () => navigator.clipboard.writeText(lines.map((l) => l.text).join('\n')),
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      <ConsoleToolbar
        running={running}
        starting={starting}
        pid={pid}
        color={color}
        lineCount={lines.length}
        autoScroll={autoScroll}
        searchOpen={searchOpen}
        onToggle={handleToggle}
        onForceStop={handleForceStop}
        onOpenWorkDir={handleOpenWorkDir}
        onScrollToBottom={() => {
          setAutoScroll(true);
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenSearch={openSearch}
        onClear={() => clearConsole(profileId)}
      />

      {searchOpen && (
        <ConsoleSearchBar
          query={searchQuery}
          matchCount={matchIndices.length}
          currentIdx={clampedIdx}
          fontSize={fontSize}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setSearchIdx(0);
          }}
          onNext={() => setSearchIdx((i) => i + 1)}
          onPrev={() => setSearchIdx((i) => i - 1)}
          onClose={closeSearch}
        />
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

      <ConsoleInput
        running={running}
        fontSize={fontSize}
        onSend={handleSendInput}
        onClear={() => clearConsole(profileId)}
        onOpenSearch={openSearch}
        historySize={settings?.consoleHistorySize ?? 200}
      />

      {lineCtxMenu && lineCtxItems.length > 0 && (
        <ContextMenu
          x={lineCtxMenu.x}
          y={lineCtxMenu.y}
          items={lineCtxItems}
          onClose={() => setLineCtxMenu(null)}
        />
      )}
    </div>
  );
}
