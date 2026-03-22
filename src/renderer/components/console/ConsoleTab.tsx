import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../store/AppStore';
import { ConsoleToolbar } from './ConsoleToolbar';
import { ConsoleSearch } from './ConsoleSearch';
import { ConsoleOutput } from './ConsoleOutput';
import { ConsoleInput } from './ConsoleInput';
import { VscClose } from 'react-icons/vsc';

export function ConsoleTab() {
  const { state, activeProfile, startProcess, stopProcess, sendInput, clearConsole, isRunning } =
    useApp();

  const profileId = activeProfile?.id ?? '';
  const running = isRunning(profileId);
  const lines = state.consoleLogs[profileId] ?? [];
  const settings = state.settings;
  const color = activeProfile?.color ?? '#4ade80';
  const processState = state.processStates.find((s) => s.profileId === profileId);

  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(0);

  // Auto-scroll state (owned here, passed down)
  const [autoScroll, setAutoScroll] = useState(true);

  // Reset on profile change
  useEffect(() => {
    setErrorMsg(null);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchIdx(0);
    setAutoScroll(true);
  }, [profileId]);

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
  }, [searchOpen]);

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

  const handleToggle = useCallback(async () => {
    if (!activeProfile) return;
    setErrorMsg(null);
    if (running) {
      await stopProcess(profileId);
    } else {
      if (!activeProfile.jarPath) {
        setErrorMsg('No JAR file selected. Go to Configure to set one.');
        return;
      }
      setStarting(true);
      const res = await startProcess(activeProfile);
      setStarting(false);
      if (!res.ok) setErrorMsg(res.error ?? 'Failed to start');
    }
  }, [activeProfile, running, profileId, stopProcess, startProcess]);

  const handleSend = useCallback(
    async (cmd: string) => {
      await sendInput(profileId, cmd);
      setCmdHistory((prev) =>
        [cmd, ...prev.filter((c) => c !== cmd)].slice(0, settings?.consoleHistorySize ?? 200)
      );
    },
    [profileId, sendInput, settings]
  );

  const handleClear = useCallback(() => clearConsole(profileId), [clearConsole, profileId]);

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        No profile selected
      </div>
    );
  }

  const fontSize = settings?.consoleFontSize ?? 13;
  const wordWrap = settings?.consoleWordWrap ?? false;
  const lineNumbers = settings?.consoleLineNumbers ?? false;

  // Calculate match count for search display
  const searchTerm = searchQuery.trim().toLowerCase();
  const matchCount = searchTerm
    ? lines.filter((l) => l.text.toLowerCase().includes(searchTerm)).length
    : 0;
  const clampedIdx = matchCount > 0 ? ((searchIdx % matchCount) + matchCount) % matchCount : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <ConsoleToolbar
        running={running}
        starting={starting}
        pid={processState?.pid}
        color={color}
        lineCount={lines.length}
        autoScroll={autoScroll}
        onToggle={handleToggle}
        onClear={handleClear}
        onOpenSearch={openSearch}
        onScrollToBottom={() => setAutoScroll(true)}
      />

      {searchOpen && (
        <ConsoleSearch
          query={searchQuery}
          matchCount={matchCount}
          currentIdx={clampedIdx}
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
        <div className="mx-3 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 animate-fade-in flex items-center justify-between shrink-0">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-60 hover:opacity-100">
            <VscClose size={12} />
          </button>
        </div>
      )}

      <ConsoleOutput
        lines={lines}
        fontSize={fontSize}
        wordWrap={wordWrap}
        lineNumbers={lineNumbers}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        searchIdx={searchIdx}
        onSearchIdxChange={setSearchIdx}
        onAutoScrollChange={setAutoScroll}
        autoScroll={autoScroll}
      />

      <ConsoleInput
        running={running}
        fontSize={fontSize}
        history={cmdHistory}
        onSend={handleSend}
        onClear={handleClear}
        onOpenSearch={openSearch}
      />
    </div>
  );
}
