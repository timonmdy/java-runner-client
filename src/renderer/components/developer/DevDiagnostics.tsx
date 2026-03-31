import { useEffect, useRef, useState } from 'react';
import { VscCheck, VscCopy } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { Button } from '../common/inputs';
import { Card, DataRow, ScrollContent, Section } from '../layout/containers';

declare const __APP_VERSION__: string;

interface PerfSample {
  timestamp: number;
  memMB: number;
}

export function DevDiagnostics() {
  const { state } = useApp();
  const [perfSamples, setPerfSamples] = useState<PerfSample[]>([]);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const samplePerf = () => {
    if (window.performance && (performance as any).memory) {
      const mb = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
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
      profileMeta: state.profiles.map((p) => ({
        id: p.id,
        name: p.name,
        envVars: (p.envVars ?? []).length,
        fileLogging: p.fileLogging ?? false,
        autoRestart: p.autoRestart,
      })),
      consoleLogCounts: Object.fromEntries(
        Object.entries(state.consoleLogs).map(([id, lines]) => [id, lines.length])
      ),
      memorySnapshot: perfSamples[perfSamples.length - 1] ?? null,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latest = perfSamples[perfSamples.length - 1];
  const maxMem = Math.max(...perfSamples.map((s) => s.memMB), 1);

  const profilesWithLogging = state.profiles.filter((p) => p.fileLogging).length;
  const totalEnvVars = state.profiles.reduce((sum, p) => sum + (p.envVars ?? []).length, 0);

  return (
    <ScrollContent>
      <Section title="JS Heap Memory (renderer)">
        <div className="rounded-lg border border-surface-border bg-base-950 px-3 py-2">
          <div className="flex items-end gap-px h-16 mb-1">
            {perfSamples.map((s, i) => (
              <div
                key={i}
                className="flex-1 bg-accent/40 rounded-t-sm transition-all duration-300"
                style={{ height: `${Math.max(4, (s.memMB / maxMem) * 100)}%` }}
                title={`${s.memMB} MB`}
              />
            ))}
            {perfSamples.length === 0 && (
              <p className="text-xs font-mono text-text-muted self-center w-full text-center">
                Collecting samples...
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span>{latest ? `${latest.memMB} MB used` : '---'}</span>
            <span>max {maxMem} MB</span>
          </div>
        </div>
      </Section>

      <Section title="Renderer State">
        <Card divided>
          <DataRow
            label="Active profile ID"
            value={state.activeProfileId || '---'}
            mono
            labelWidth="w-44"
          />
          <DataRow
            label="Profiles loaded"
            value={String(state.profiles.length)}
            labelWidth="w-44"
          />
          <DataRow
            label="Process states"
            value={String(state.processStates.length)}
            labelWidth="w-44"
          />
          <DataRow
            label="Console buffers"
            value={`${Object.keys(state.consoleLogs).length} profiles`}
            labelWidth="w-44"
          />
          <DataRow
            label="Total buffered lines"
            value={String(Object.values(state.consoleLogs).reduce((a, b) => a + b.length, 0))}
            labelWidth="w-44"
          />
          <DataRow
            label="Settings loaded"
            value={state.settings ? 'Yes' : 'No'}
            labelWidth="w-44"
          />
        </Card>
      </Section>

      <Section title="Feature Usage">
        <Card divided>
          <DataRow
            label="Console timestamps"
            value={state.settings?.consoleTimestamps ? 'On' : 'Off'}
            labelWidth="w-44"
          />
          <DataRow
            label="File logging (profiles)"
            value={`${profilesWithLogging} / ${state.profiles.length}`}
            labelWidth="w-44"
          />
          <DataRow label="Total env vars" value={String(totalEnvVars)} labelWidth="w-44" />
          <DataRow
            label="REST API"
            value={state.settings?.restApiEnabled ? `Port ${state.settings.restApiPort}` : 'Off'}
            labelWidth="w-44"
          />
          <DataRow
            label="Word wrap"
            value={state.settings?.consoleWordWrap ? 'On' : 'Off'}
            labelWidth="w-44"
          />
          <DataRow
            label="Line numbers"
            value={state.settings?.consoleLineNumbers ? 'On' : 'Off'}
            labelWidth="w-44"
          />
        </Card>
      </Section>

      <Section title="Profile Console Buffers">
        {state.profiles.length === 0 ? (
          <p className="text-xs font-mono text-text-muted">No profiles</p>
        ) : (
          <Card divided>
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
                  <span className="text-[10px] font-mono text-text-muted">
                    {(p.envVars ?? []).length > 0 ? `${(p.envVars ?? []).length} env` : ''}
                    {p.fileLogging ? ' log' : ''}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {lines.toLocaleString()} lines
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </Section>

      <Section title="Diagnostic Report">
        <p className="text-xs text-text-muted font-mono">
          Copy a JSON snapshot of the current app state to clipboard for bug reports.
        </p>
        <Button variant="ghost" size="sm" onClick={exportDiagReport}>
          {copied ? <VscCheck size={11} className="text-accent" /> : <VscCopy size={11} />}
          {copied ? 'Copied!' : 'Copy Report to Clipboard'}
        </Button>
      </Section>
    </ScrollContent>
  );
}
