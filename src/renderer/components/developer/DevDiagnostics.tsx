import React, { useEffect, useRef, useState } from 'react';
import { VscCheck, VscCopy } from 'react-icons/vsc';
import { useApp } from '../../store/AppStore';
import { Button } from '../common/Button';

interface PerfSample {
  timestamp: number;
  memMB: number;
}

export function DevDiagnostics() {
  const { state } = useApp();
  const [perfSamples, setPerfSamples] = useState<PerfSample[]>([]);
  const [copied, setCopied] = useState(false);
  const [ipcLog, setIpcLog] = useState<{ ts: number; msg: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const samplePerf = () => {
    if (window.performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      const mb = Math.round(mem.usedJSHeapSize / 1024 / 1024);
      setPerfSamples((prev) => [...prev.slice(-29), { timestamp: Date.now(), memMB: mb }]);
    }
  };

  useEffect(() => {
    samplePerf();
    intervalRef.current = setInterval(samplePerf, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const exportDiagReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
      profiles: state.profiles.length,
      runningProcesses: state.processStates.filter((s) => s.running).length,
      settings: state.settings,
      consoleLogCounts: Object.fromEntries(
        Object.entries(state.consoleLogs).map(([id, lines]) => [id, lines.length])
      ),
      memorySnapshot: perfSamples[perfSamples.length - 1] ?? null,
    };
    const text = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latest = perfSamples[perfSamples.length - 1];
  const maxMem = Math.max(...perfSamples.map((s) => s.memMB), 1);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      {/* Memory chart */}
      <Section title="JS Heap Memory (renderer)">
        <div className="rounded-lg border border-surface-border bg-base-950 px-3 py-2">
          <div className="flex items-end gap-px h-16 mb-1">
            {perfSamples.map((s, i) => {
              const pct = (s.memMB / maxMem) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-accent/40 rounded-t-sm transition-all duration-300"
                  style={{ height: `${Math.max(4, pct)}%` }}
                  title={`${s.memMB} MB`}
                />
              );
            })}
            {perfSamples.length === 0 && (
              <p className="text-xs font-mono text-text-muted self-center w-full text-center">
                Collecting samples...
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span>{latest ? `${latest.memMB} MB used` : '—'}</span>
            <span>max {maxMem} MB</span>
          </div>
        </div>
      </Section>

      {/* Renderer state summary */}
      <Section title="Renderer State">
        <div className="rounded-lg border border-surface-border bg-base-900 divide-y divide-surface-border/50">
          <DiagRow label="Active profile ID" value={state.activeProfileId || '—'} mono />
          <DiagRow label="Profiles loaded" value={String(state.profiles.length)} />
          <DiagRow label="Process states" value={String(state.processStates.length)} />
          <DiagRow
            label="Console buffers"
            value={`${Object.keys(state.consoleLogs).length} profiles`}
          />
          <DiagRow
            label="Total buffered lines"
            value={String(Object.values(state.consoleLogs).reduce((a, b) => a + b.length, 0))}
          />
          <DiagRow label="Settings loaded" value={state.settings ? 'Yes' : 'No'} />
        </div>
      </Section>

      {/* Profile detail */}
      <Section title="Profile Console Buffers">
        {state.profiles.length === 0 ? (
          <p className="text-xs font-mono text-text-muted">No profiles</p>
        ) : (
          <div className="rounded-lg border border-surface-border bg-base-900 divide-y divide-surface-border/50">
            {state.profiles.map((p) => {
              const lines = state.consoleLogs[p.id]?.length ?? 0;
              const running = state.processStates.some((s) => s.profileId === p.id && s.running);
              return (
                <div key={p.id} className="px-3 py-2 flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: running ? (p.color ?? '#4ade80') : '#242736' }}
                  />
                  <span className="text-xs font-mono text-text-primary flex-1 truncate">
                    {p.name}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {lines.toLocaleString()} lines
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Export */}
      <Section title="Diagnostic Report">
        <p className="text-xs text-text-muted font-mono">
          Copy a JSON snapshot of the current app state to clipboard for bug reports.
        </p>
        <Button variant="ghost" size="sm" onClick={exportDiagReport}>
          {copied ? <VscCheck size={11} className="text-accent" /> : <VscCopy size={11} />}
          {copied ? 'Copied!' : 'Copy Report to Clipboard'}
        </Button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function DiagRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs text-text-muted font-mono w-44 shrink-0">{label}</span>
      <span
        className={[
          'text-xs flex-1 truncate text-right',
          mono ? 'font-mono text-text-secondary' : 'text-text-secondary',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

declare const __APP_VERSION__: string;
