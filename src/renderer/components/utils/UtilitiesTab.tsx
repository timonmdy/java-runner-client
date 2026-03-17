/**
 * UtilitiesTab — Activity Log + Process Scanner.
 * Process Scanner: expandable rows with tags + extended info.
 */
import React, { useState, useCallback } from 'react'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { VscCheck, VscListUnordered } from 'react-icons/vsc'
import { LuScanLine } from 'react-icons/lu'
import type { ProcessLogEntry, JavaProcessInfo } from '../../types'

type Panel = 'log' | 'scanner'

const PANELS = [
  { id: 'log',     label: 'Activity Log',    Icon: VscListUnordered },
  { id: 'scanner', label: 'Process Scanner', Icon: LuScanLine },
]

export function UtilitiesTab() {
  const [panel, setPanel] = useState<Panel>('log')
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0 px-4 border-b border-surface-border bg-base-900 shrink-0">
        {PANELS.map(p => (
          <button key={p.id} onClick={() => setPanel(p.id as Panel)}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono border-b-2 -mb-px transition-colors',
              panel === p.id ? 'text-text-primary border-text-muted font-medium' : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}>
            <p.Icon size={13}/>{p.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {panel === 'log'     && <ActivityLogPanel />}
        {panel === 'scanner' && <ScannerPanel />}
      </div>
    </div>
  )
}

// ── Activity Log ──────────────────────────────────────────────────────────────

function ActivityLogPanel() {
  const [entries,      setEntries]      = useState<ProcessLogEntry[] | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setEntries(await window.api.getProcessLog())
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900/50 shrink-0">
          <p className="text-xs text-text-muted flex-1">All processes started by JRC this session</p>
          <Button variant="ghost" size="sm" onClick={load} loading={loading}>Refresh</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} disabled={!entries || entries.length === 0}>Clear</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && !entries && <p className="text-xs text-text-muted py-8 text-center font-mono">Loading…</p>}
          {entries && entries.length === 0 && <EmptyState icon={<VscListUnordered size={28}/>} text="No processes started yet this session"/>}
          {entries && entries.length > 0 && (
            <div className="space-y-2">{entries.map(e => <LogEntryRow key={e.id} entry={e}/>)}</div>
          )}
        </div>
      </div>
      <Dialog open={confirmClear} title="Clear activity log?"
        message="All recorded process entries will be removed. Running processes are not affected."
        confirmLabel="Clear" danger
        onConfirm={async () => { await window.api.clearProcessLog(); setEntries([]); setConfirmClear(false) }}
        onCancel={() => setConfirmClear(false)}/>
    </>
  )
}

function LogEntryRow({ entry }: { entry: ProcessLogEntry }) {
  const duration = entry.stoppedAt ? formatDuration(entry.stoppedAt - entry.startedAt) : null
  const jarName  = entry.jarPath.split(/[/\\]/).pop() ?? entry.jarPath
  return (
    <div className="rounded-lg border border-surface-border bg-base-900 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium text-text-primary">{entry.profileName}</span>
            <code className="font-mono text-xs text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">PID {entry.pid}</code>
            {entry.stoppedAt
              ? <span className="text-xs text-text-muted">stopped</span>
              : <span className="flex items-center gap-1 text-xs text-accent"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot"/>running</span>
            }
          </div>
          <p className="text-xs text-text-muted font-mono truncate" title={entry.jarPath}>{jarName}</p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs text-text-muted font-mono">{formatTime(entry.startedAt)}</p>
          {duration && <p className="text-xs text-text-muted/60 font-mono">{duration}</p>}
          {entry.exitCode !== undefined && (
            <p className={['text-xs font-mono', entry.exitCode === 0 ? 'text-accent' : 'text-console-error'].join(' ')}>exit {entry.exitCode}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Process Scanner ───────────────────────────────────────────────────────────

interface KillIntent { proc: JavaProcessInfo; nonJava: boolean }

function ScannerPanel() {
  const [results,        setResults]        = useState<JavaProcessInfo[] | null>(null)
  const [scanning,       setScanning]       = useState(false)
  const [killIntent,     setKillIntent]     = useState<KillIntent | null>(null)
  const [killAllConfirm, setKillAllConfirm] = useState(false)
  const [statusMsg,      setStatusMsg]      = useState<{ text: string; ok: boolean } | null>(null)
  const [killedPids,     setKilledPids]     = useState<Set<number>>(new Set())
  const [filter,         setFilter]         = useState<'all' | 'java'>('java')
  const [search,         setSearch]         = useState('')
  const [expandedPid,    setExpandedPid]    = useState<number | null>(null)

  const scan = useCallback(async () => {
    setScanning(true); setStatusMsg(null); setKilledPids(new Set()); setSearch(''); setExpandedPid(null)
    const found = await window.api.scanAllProcesses()
    setResults(found); setScanning(false)
    const javaCount = found.filter(p => p.isJava).length
    setStatusMsg({ text: `Found ${found.length} processes — ${javaCount} java`, ok: true })
  }, [])

  const handleKill = async () => {
    if (!killIntent) return
    const res = await window.api.killPid(killIntent.proc.pid)
    if (res.ok) {
      setKilledPids(prev => new Set([...prev, killIntent.proc.pid]))
      setStatusMsg({ text: `Killed PID ${killIntent.proc.pid}`, ok: true })
    } else {
      setStatusMsg({ text: `Failed to kill PID ${killIntent.proc.pid}: ${res.error}`, ok: false })
    }
    setKillIntent(null)
  }

  const handleKillAll = async () => {
    const res = await window.api.killAllJava()
    setStatusMsg({ text: `Killed ${res.killed} java process${res.killed === 1 ? '' : 'es'}`, ok: true })
    setKillAllConfirm(false)
    setTimeout(scan, 800)
  }

  const searchLower = search.trim().toLowerCase()
  const visible = results
    ? (filter === 'java' ? results.filter(r => r.isJava) : results)
        .filter(r => !killedPids.has(r.pid))
        .filter(r => !searchLower || r.command.toLowerCase().includes(searchLower) || String(r.pid).includes(searchLower))
    : null

  const javaVisible = visible?.some(r => r.isJava) ?? false

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900/50 shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-1 bg-base-950 rounded-lg p-0.5 border border-surface-border">
          {(['java', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={['px-2.5 py-1 text-xs rounded-md transition-colors font-mono',
                filter === f ? 'bg-surface-raised text-text-primary' : 'text-text-muted hover:text-text-primary'].join(' ')}>
              {f === 'java' ? 'Java only' : 'All'}
            </button>
          ))}
        </div>
        {results !== null && (
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search PID or command…"
            className="h-7 bg-base-950 border border-surface-border rounded-md px-2.5 text-xs font-mono
              text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 w-48"/>
        )}
        <div className="flex-1"/>
        {javaVisible && <Button variant="danger" size="sm" onClick={() => setKillAllConfirm(true)}>Kill All Java</Button>}
        <Button variant="primary" size="sm" onClick={scan} loading={scanning}>{results === null ? 'Scan' : 'Re-scan'}</Button>
      </div>

      {statusMsg && (
        <div className={['mx-4 mt-2 shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border animate-fade-in',
          statusMsg.ok ? 'bg-surface-raised border-surface-border text-text-secondary' : 'bg-red-500/10 border-red-500/20 text-red-400'].join(' ')}>
          {statusMsg.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {results === null && !scanning && <EmptyState icon={<LuScanLine size={28}/>} text='Click "Scan" to list all running processes'/>}
        {scanning && <p className="text-xs text-text-muted font-mono py-8 text-center animate-pulse">Scanning all processes…</p>}
        {visible !== null && visible.length === 0 && !scanning && (
          <EmptyState icon={<VscCheck size={28}/>} text={filter === 'java' ? 'No java processes found' : 'No processes found'}/>
        )}
        {visible !== null && visible.length > 0 && (
          <div className="space-y-1.5">
            {visible.map(proc => (
              <ProcessRow
                key={proc.pid} proc={proc}
                expanded={expandedPid === proc.pid}
                onToggle={() => setExpandedPid(expandedPid === proc.pid ? null : proc.pid)}
                onKill={() => setKillIntent({ proc, nonJava: !proc.isJava })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!killIntent}
        title={killIntent?.nonJava ? 'Kill non-Java process?' : `Kill PID ${killIntent?.proc.pid}?`}
        message={killIntent?.nonJava
          ? `Warning: this process does not appear to be Java.\n\nCommand: ${(killIntent?.proc.command ?? '').slice(0, 120)}\n\nForcefully terminating unknown processes can cause data loss.`
          : `Forcefully terminate PID ${killIntent?.proc.pid}?\n\nCommand: ${(killIntent?.proc.command ?? '').slice(0, 120)}`}
        confirmLabel={killIntent?.nonJava ? 'Kill anyway' : 'Kill Process'}
        danger onConfirm={handleKill} onCancel={() => setKillIntent(null)}/>

      <Dialog open={killAllConfirm} title="Kill all Java processes?"
        message="This forcefully terminates every java process on this machine — including those not managed by JRC. Running servers will lose unsaved data."
        confirmLabel="Kill All" danger onConfirm={handleKillAll} onCancel={() => setKillAllConfirm(false)}/>
    </div>
  )
}

function ProcessRow({ proc, expanded, onToggle, onKill }: {
  proc: JavaProcessInfo; expanded: boolean; onToggle: () => void; onKill: () => void
}) {
  return (
    <div className={['rounded-lg border transition-colors overflow-hidden',
      proc.isJava ? 'border-accent/20 bg-accent/5' : 'border-surface-border bg-base-900/40'].join(' ')}>

      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Expand toggle */}
        <button onClick={onToggle} className="text-text-muted hover:text-text-primary transition-colors shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            className={['transition-transform', expanded ? 'rotate-90' : ''].join(' ')}>
            <polyline points="3,2 7,5 3,8"/>
          </svg>
        </button>

        {/* Tags */}
        <div className="flex items-center gap-1 shrink-0">
          {proc.managed && (
            <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-accent/15 text-accent border border-accent/30">Managed</span>
          )}
          {proc.isJava
            ? <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">Java</span>
            : <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-surface-raised text-text-muted border border-surface-border">Non-Java</span>
          }
        </div>

        <code className={['text-xs font-mono shrink-0 w-14', proc.isJava ? 'text-accent' : 'text-text-muted'].join(' ')}>
          {proc.pid}
        </code>

        <span className="text-xs font-mono text-text-secondary truncate flex-1 min-w-0" title={proc.command}>
          {proc.jarName ?? proc.name ?? proc.command.slice(0, 60)}
        </span>

        {proc.memoryMB !== undefined && (
          <span className="text-xs font-mono text-text-muted shrink-0">{proc.memoryMB} MB</span>
        )}

        <Button variant="danger" size="sm" onClick={onKill}>Kill</Button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-10 pb-3 pt-1 border-t border-surface-border/50 space-y-1.5 animate-fade-in">
          <DetailRow label="Full command" value={proc.command} mono wrap/>
          {proc.jarName   && <DetailRow label="JAR"         value={proc.jarName}/>}
          {proc.memoryMB  !== undefined && <DetailRow label="Memory"   value={`${proc.memoryMB} MB`}/>}
          {proc.threads   !== undefined && <DetailRow label="Threads"  value={String(proc.threads)}/>}
          {proc.startTime && <DetailRow label="Started"    value={proc.startTime}/>}
          <DetailRow label="Managed by JRC" value={proc.managed ? 'Yes' : 'No'}/>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono, wrap }: { label: string; value: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="text-text-muted font-mono w-28 shrink-0">{label}</span>
      <span className={[mono ? 'font-mono' : '', wrap ? 'break-all' : 'truncate', 'text-text-secondary flex-1'].join(' ')}>
        {value}
      </span>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
      {icon}
      <p className="text-xs font-mono text-center max-w-xs leading-relaxed">{text}</p>
    </div>
  )
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`
}
