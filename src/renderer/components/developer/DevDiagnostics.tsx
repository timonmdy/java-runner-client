import { JRCEnvironment } from '@shared/types/App.types';
import { useEffect, useRef, useState } from 'react';
import { VscCheck, VscCopy } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { Button } from '../common/inputs';
import { Card, DataRow, ScrollContent, Section } from '../common/layout/containers';

declare const __APP_VERSION__: string;

interface PerfSample {
  timestamp: number;
  heapUsedMB: number;
  heapTotalMB: number;
  heapLimitMB: number;
}

interface SysInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  argv: string[];
  uptime: number;
  memoryUsageMB: number;
}

function samplePerf(): PerfSample | null {
  const mem = (performance as any).memory;
  if (!mem) return null;
  return {
    timestamp: Date.now(),
    heapUsedMB: Math.round(mem.usedJSHeapSize / 1024 / 1024),
    heapTotalMB: Math.round(mem.totalJSHeapSize / 1024 / 1024),
    heapLimitMB: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
  };
}

export function DevDiagnostics() {
  const { state } = useApp();
  const [perfSamples, setPerfSamples] = useState<PerfSample[]>([]);
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [env, setEnv] = useState<JRCEnvironment>();
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      const s = samplePerf();
      if (s) setPerfSamples((prev) => [...prev.slice(-59), s]);
    };
    tick();
    intervalRef.current = setInterval(tick, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    jrc.api.getSysInfo().then(setSysInfo);
    jrc.env.get().then(setEnv);
  }, []);

  const latest = perfSamples[perfSamples.length - 1];
  const maxUsed = Math.max(...perfSamples.map((s) => s.heapUsedMB), 1);

  const totalConsoleLines = Object.values(state.consoleLogs).reduce((a, b) => a + b.length, 0);
  const runningCount = state.processStates.filter((s) => s.running).length;
  const profilesWithLogging = state.profiles.filter((p) => p.fileLogging).length;
  const totalEnvVars = state.profiles.reduce((sum, p) => sum + (p.envVars ?? []).length, 0);

  const exportBugReport = () => {
    const report = {
      _generated: new Date().toISOString(),
      _version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
      environment: {
        platform: sysInfo?.platform,
        arch: sysInfo?.arch,
        nodeVersion: sysInfo?.nodeVersion,
        electronVersion: sysInfo?.electronVersion,
        chromeVersion: sysInfo?.chromeVersion,
        uptime: sysInfo?.uptime,
        type: env?.type,
        launchContext: env?.launchContext,
      },
      memory: {
        mainProcessMB: sysInfo?.memoryUsageMB,
        rendererHeapUsedMB: latest?.heapUsedMB,
        rendererHeapTotalMB: latest?.heapTotalMB,
        rendererHeapLimitMB: latest?.heapLimitMB,
      },
      state: {
        profiles: state.profiles.length,
        runningProcesses: runningCount,
        totalConsoleLines,
        totalEnvVars,
        profilesWithFileLogging: profilesWithLogging,
        settingsLoaded: !!state.settings,
      },
      settings: state.settings,
      profileMeta: state.profiles.map((p) => ({
        id: p.id,
        name: p.name,
        envVars: (p.envVars ?? []).length,
        fileLogging: p.fileLogging ?? false,
        autoRestart: p.autoRestart,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollContent>
      {/* ── JS Heap Memory ──────────────────────────────── */}
      <Section title="JS Heap Memory (renderer)">
        <div className="rounded-lg border border-surface-border bg-base-950 px-3 py-2">
          <div className="flex items-end gap-px h-20 mb-1">
            {perfSamples.map((s, i) => (
              <div
                key={i}
                className="flex-1 bg-accent/40 rounded-t-sm transition-all duration-300"
                style={{ height: `${Math.max(4, (s.heapUsedMB / maxUsed) * 100)}%` }}
                title={`${s.heapUsedMB} MB`}
              />
            ))}
            {perfSamples.length === 0 && (
              <p className="text-xs font-mono text-text-muted self-center w-full text-center">
                Collecting samples...
              </p>
            )}
          </div>
          {latest && (
            <div className="flex items-center justify-between text-xs font-mono text-text-muted">
              <span>{latest.heapUsedMB} MB used</span>
              <span>{latest.heapTotalMB} MB allocated</span>
              <span>{latest.heapLimitMB} MB limit</span>
            </div>
          )}
        </div>
      </Section>

      {/* ── Renderer Metrics ────────────────────────────── */}
      <Section title="Renderer Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MetricCard label="Profiles" value={state.profiles.length} />
          <MetricCard label="Running" value={runningCount} accent={runningCount > 0} />
          <MetricCard label="Console Lines" value={totalConsoleLines} />
          <MetricCard label="Env Vars" value={totalEnvVars} />
        </div>
      </Section>

      {/* ── Profile Console Buffers ─────────────────────── */}
      {state.profiles.length > 0 && (
        <Section title="Console Buffers" collapsible>
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
                  <span className="text-xs font-mono text-text-muted">
                    {lines.toLocaleString()} lines
                  </span>
                </div>
              );
            })}
          </Card>
        </Section>
      )}

      {/* ── Renderer State ──────────────────────────────── */}
      <Section title="Renderer State" collapsible defaultCollapsed>
        <Card divided>
          <DataRow label="Active profile ID" value={state.activeProfileId || '---'} mono />
          <DataRow label="Process states" value={String(state.processStates.length)} />
          <DataRow
            label="Console buffers"
            value={`${Object.keys(state.consoleLogs).length} profiles`}
          />
          <DataRow label="Settings loaded" value={state.settings ? 'Yes' : 'No'} />
          <DataRow
            label="File logging"
            value={`${profilesWithLogging} / ${state.profiles.length}`}
          />
        </Card>
      </Section>

      {/* ── Bug Report ──────────────────────────────────── */}
      <Section title="Bug Report">
        <p className="text-xs text-text-muted font-mono leading-relaxed">
          Copies a JSON snapshot including app version, environment, memory stats, settings, and
          profile metadata to clipboard. Paste into a bug report for full context.
        </p>
        <Button variant="ghost" size="sm" onClick={exportBugReport}>
          {copied ? <VscCheck size={11} className="text-accent" /> : <VscCopy size={11} />}
          {copied ? 'Copied!' : 'Copy Bug Report to Clipboard'}
        </Button>
      </Section>
    </ScrollContent>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className="px-4 py-3 space-y-1">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{label}</p>
      <p
        className={`text-2xl font-mono font-semibold ${accent ? 'text-accent' : 'text-text-primary'}`}
      >
        {value.toLocaleString()}
      </p>
    </Card>
  );
}
