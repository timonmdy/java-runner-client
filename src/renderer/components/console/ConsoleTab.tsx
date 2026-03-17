/**
 * ConsoleTab — live stdout/stderr, stdin, history (↑↓), line numbers, PID display.
 */
import React, { useRef, useEffect, useState, useCallback, KeyboardEvent } from 'react'
import { useApp } from '../../store/AppStore'
import { Button } from '../common/Button'
import type { ConsoleLine } from '../../types'
import { clearAllConsoleLogs } from '../../utils/consoleStorage'

export function ConsoleTab() {
  const { state, activeProfile, startProcess, stopProcess, sendInput, clearConsole, isRunning } = useApp()

  const profileId = activeProfile?.id ?? ''
  const running   = isRunning(profileId)
  const lines     = state.consoleLogs[profileId] ?? []
  const settings  = state.settings
  const color     = activeProfile?.color ?? '#4ade80'

  // Running process state info
  const processState = state.processStates.find(s => s.profileId === profileId)
  const pid          = processState?.pid

  const [inputValue, setInputValue] = useState('')
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [starting,   setStarting]   = useState(false)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchIndex, setSearchIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [lines.length, autoScroll])
  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  // Global CTRL+F listener for console search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!document.hidden && e.key === 'f' && e.ctrlKey) {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handleKeyDown as any)
    return () => window.removeEventListener('keydown', handleKeyDown as any)
  }, [])

  // Auto-scroll to current match when search index or lines change
  useEffect(() => {
    if (!searchQuery.trim()) return
    const matchingIndices = lines
      .map((line, idx) => line.text.toLowerCase().includes(searchQuery.toLowerCase()) ? idx : -1)
      .filter(idx => idx >= 0)
    const currentIdx = matchingIndices[searchIndex % Math.max(1, matchingIndices.length)] ?? -1
    if (currentIdx >= 0) {
      setTimeout(() => {
        const matchedElement = document.querySelector(`[data-console-line="${currentIdx}"]`)
        if (matchedElement) {
          matchedElement.scrollIntoView({ behavior: 'auto', block: 'center' })
        }
      }, 0)
    }
  }, [searchIndex, searchQuery, lines])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }, [])

  const handleToggle = async () => {
    if (!activeProfile) return
    setErrorMsg(null)
    if (running) {
      await stopProcess(profileId)
    } else {
      if (!activeProfile.jarPath) { setErrorMsg('No JAR file selected. Go to Configure to set one.'); return }
      setStarting(true)
      const res = await startProcess(activeProfile)
      setStarting(false)
      if (!res.ok) setErrorMsg(res.error ?? 'Failed to start')
    }
  }

  const handleSend = useCallback(async () => {
    const cmd = inputValue.trim()
    if (!cmd || !running) return
    await sendInput(profileId, cmd)
    setCmdHistory(prev => {
      const next = [cmd, ...prev.filter(c => c !== cmd)]
      return next.slice(0, settings?.consoleHistorySize ?? 200)
    })
    setInputValue('')
    setHistoryIdx(-1)
  }, [inputValue, running, profileId, sendInput, settings])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')     { e.preventDefault(); handleSend(); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); const n = Math.min(historyIdx+1, cmdHistory.length-1); setHistoryIdx(n); setInputValue(cmdHistory[n]??''); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.max(historyIdx-1, -1); setHistoryIdx(n); setInputValue(n===-1?'':cmdHistory[n]??''); return }
    if (e.key==='l' && e.ctrlKey) { e.preventDefault(); clearConsole(profileId) }
  }

  // Find matching lines for search
  const matchingIndices = searchQuery.trim()
    ? lines
        .map((line, idx) => line.text.toLowerCase().includes(searchQuery.toLowerCase()) ? idx : -1)
        .filter(idx => idx >= 0)
    : []
  const matchCount = matchingIndices.length
  const currentMatchIdx = matchingIndices[searchIndex % Math.max(1, matchingIndices.length)] ?? -1

  const fontSize    = settings?.consoleFontSize    ?? 13
  const wordWrap    = settings?.consoleWordWrap     ?? false
  const lineNumbers = settings?.consoleLineNumbers  ?? false

  {console.log(lines)}

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-base-900 shrink-0">
        <Button
          variant={running ? 'danger' : 'primary'}
          size="sm"
          onClick={handleToggle}
          loading={starting}
          disabled={!activeProfile}
          style={!running ? { backgroundColor: color, color: '#08090d', borderColor: color } : {}}
        >
          {running ? <><StopIcon /> Stop</> : <><PlayIcon /> Run</>}
        </Button>

        {/* PID + running indicator */}
        {running && pid && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: color }}/>
            <span>PID <span className="text-text-secondary">{pid}</span></span>
          </span>
        )}

        <div className="flex-1"/>

        {!autoScroll && (
          <button
            onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
            className="text-xs font-mono transition-colors"
            style={{ color }}
          >
            ↓ scroll to bottom
          </button>
        )}

        <Button variant="ghost" size="sm" 
          onClick={() => setShowSearch(true)} 
          title="Search (Ctrl+F)"
          className="!p-2">
          <SearchIcon />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => clearConsole(profileId)} title="Clear (Ctrl+L)">
          <TrashIcon /> Clear
        </Button>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-text-muted hover:text-text-primary transition-colors p-2 text-sm font-bold"
            title="Console options">
            ⋮
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-base-850 border border-surface-border rounded-lg shadow-panel py-1 z-50 animate-fade-in">
                <button
                  onClick={() => {
                    clearAllConsoleLogs()
                    clearConsole(profileId)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-text-primary hover:bg-surface-raised transition-colors"
                >
                  Reset all console logs
                </button>
              </div>
            </>
          )}
        </div>

        <span className="text-xs text-text-muted font-mono tabular-nums">
          {lines.length.toLocaleString()} lines
        </span>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-3 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 animate-fade-in flex items-center justify-between shrink-0">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-60 hover:opacity-100">x</button>
        </div>
      )}

      {/* Console output — horizontal scroll via overflow-x-auto on inner div */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto px-0 py-2 console-output"
        style={{ fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize }}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 ? (
          <EmptyConsole running={running} hasJar={!!activeProfile?.jarPath} />
        ) : (
          // min-w-max forces horizontal scroll instead of wrapping when wordWrap is off
          <div className={wordWrap ? 'px-3' : 'min-w-max px-3'}>
            {lines.map((line, idx) => (
              <ConsoleLineRow
                key={profileId + "-" + line.id}
                line={line}
                lineNumber={idx + 1}
                showLineNumbers={lineNumbers}
                wordWrap={wordWrap}
                highlightQuery={searchQuery}
                isCurrentMatch={idx === currentMatchIdx}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      {showSearch && (
        <div className="px-3 pt-2 pb-1 shrink-0 border-t border-surface-border bg-base-900">
          <div className="flex items-center gap-2 bg-base-950 border border-surface-border rounded px-2 py-1.5">
            <SearchIcon />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0) }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setShowSearch(false)
                  setSearchQuery('')
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  setSearchIndex(index => (index + 1) % Math.max(1, matchCount))
                }
              }}
              placeholder="Search console… (Enter to find next, Esc to close)"
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-xs"
              autoComplete="off"
            />
            {matchCount > 0 && (
              <>
                <button
                  onClick={() => setSearchIndex(idx => (idx - 1 + matchCount) % matchCount)}
                  title="Previous match"
                  className="text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="9 10 3 6 9 2"/>
                  </svg>
                </button>
                <span className="text-xs text-text-muted font-mono whitespace-nowrap">
                  {searchIndex + 1} / {matchCount}
                </span>
                <button
                  onClick={() => setSearchIndex(idx => (idx + 1) % matchCount)}
                  title="Next match"
                  className="text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="3 2 9 6 3 10"/>
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              className="text-text-muted hover:text-text-primary transition-colors ml-1 shrink-0"
              title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="px-3 pb-3 shrink-0">
        <div
          className={[
            'flex items-center gap-2 bg-base-900 border rounded-lg px-3 py-2 transition-colors',
            !running && 'border-surface-border opacity-50',
          ].filter(Boolean).join(' ')}
          style={running ? { borderColor: `${color}50` } : {}}
        >
          <span className="font-mono text-sm select-none shrink-0" style={{ color }}>›</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setHistoryIdx(-1) }}
            onKeyDown={handleKeyDown}
            disabled={!running}
            placeholder={running ? 'Send command… (↑↓ history, Ctrl+L clear)' : 'Start the process to send commands'}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none font-mono text-sm"
            style={{ fontSize }}
            autoComplete="off" spellCheck={false}
          />
          <Button variant="ghost" size="sm" onClick={handleSend}
            disabled={!running || !inputValue.trim()} className="!p-1 shrink-0" title="Send (Enter)">
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Console line ──────────────────────────────────────────────────────────────

const LINE_COLORS: Record<ConsoleLine['type'], string> = {
  stdout: 'text-text-primary',
  stderr: 'text-console-error',
  input:  'text-console-input',
  system: 'text-text-muted',
}
const LINE_PREFIX: Record<ConsoleLine['type'], string> = {
  stdout: '', stderr: '', input: '› ', system: '# ',
}

function ConsoleLineRow({ line, lineNumber, showLineNumbers, wordWrap, highlightQuery, isCurrentMatch }: {
  line: ConsoleLine; lineNumber: number; showLineNumbers: boolean; wordWrap: boolean; highlightQuery?: string; isCurrentMatch?: boolean
}) {
  const highlight = highlightQuery?.trim()

  return (
    <div 
      data-console-line={lineNumber - 1}
      className={['flex leading-5 min-h-[1.25rem]', LINE_COLORS[line.type], 
        isCurrentMatch ? 'bg-yellow-500/15 border-l-2 border-yellow-500/50 pl-1' : 
        (highlight && line.text.toLowerCase().includes(highlight.toLowerCase()) ? 'bg-yellow-500/5' : '')
      ].join(' ')}>
      {showLineNumbers && (
        <span className="select-none text-text-muted/40 text-right pr-3 shrink-0 tabular-nums"
          style={{ minWidth: '3em' }}>
          {lineNumber}
        </span>
      )}
      <span
        className={[
          'flex-1',
          wordWrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre',
        ].join(' ')}
      >
        <span className="select-none opacity-40">{LINE_PREFIX[line.type]}</span>
        {highlight && line.text.toLowerCase().includes(highlight.toLowerCase())
          ? highlight_LineText(line.text, highlight)
          : line.text
        }
      </span>
    </div>
  )
}

/**
 * Highlight matching text in a line.
 */
function highlight_LineText(text: string, query: string): React.ReactNode {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIdx = 0

  let matchIdx = lowerText.indexOf(lowerQuery)
  while (matchIdx !== -1) {
    if (matchIdx > lastIdx) {
      parts.push(text.substring(lastIdx, matchIdx))
    }
    parts.push(
      <span key={`m-${matchIdx}`} className="bg-yellow-500/30 font-medium">
        {text.substring(matchIdx, matchIdx + query.length)}
      </span>
    )
    lastIdx = matchIdx + query.length
    matchIdx = lowerText.indexOf(lowerQuery, lastIdx)
  }
  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx))
  }
  return parts
}

function EmptyConsole({ running, hasJar }: { running: boolean; hasJar: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 select-none opacity-30 py-12">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/><path d="M6 8l3 3-3 3" strokeWidth="1.5"/><path d="M11 14h6" strokeWidth="1.5"/>
      </svg>
      <p className="text-sm font-mono text-text-muted">
        {!hasJar ? 'No JAR configured — go to Configure' : running ? 'Waiting for output…' : 'Process not running'}
      </p>
    </div>
  )
}

const PlayIcon  = () => <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5l9 4.5-9 4.5V1.5z"/></svg>
const StopIcon  = () => <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1.5"/></svg>
const TrashIcon = () => <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4M3 4l.8 7.5a1 1 0 001 .5h4.4a1 1 0 001-.5L11 4"/></svg>
const SendIcon  = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l4 2 2 4 4-11z"/></svg>
const SearchIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M11.5 11.5l3 3"/></svg>
