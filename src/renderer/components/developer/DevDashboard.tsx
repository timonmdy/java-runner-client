import { JRCEnvironment } from '@shared/types/App.types';
import React, { useEffect, useState } from 'react';
import { VscCircle, VscCircleFilled } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';

declare const __APP_VERSION__: string;

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

export function DevDashboard() {
  const { state } = useApp();
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [env, setEnv] = useState<JRCEnvironment>();

  useEffect(() => {
    const load = () => window.api.getSysInfo().then(setSysInfo);
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.env.get().then(setEnv);
  }, []);

  const runningProfiles = state.processStates.filter((s) => s.running);
  const totalConsoleLines = Object.values(state.consoleLogs).reduce((a, b) => a + b.length, 0);
  const restEnabled = state.settings?.restApiEnabled ?? false;

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="px-4 py-4 space-y-5">
        <DevSection title="Environment">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Start-Source" value={env?.startUpSource ?? 'undefined'} />
            <StatCard label="Type (env)" value={env?.type ?? 'undefined'} />
          </div>
        </DevSection>

        {sysInfo && (
          <div className="rounded-lg bg-base-900 border border-surface-border p-3">
            <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">
              Process Argv
            </p>
            <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
              {sysInfo.argv.join(' ')}
            </p>
          </div>
        )}

        <DevSection title="Feature Flags">
          <div className="flex flex-wrap gap-2">
            <Badge ok={restEnabled} label="REST API" />
            <Badge ok={state.settings?.launchOnStartup ?? false} label="Launch on Startup" />
            <Badge ok={state.settings?.minimizeToTray ?? false} label="Minimize to Tray" />
            <Badge ok={state.settings?.consoleWordWrap ?? false} label="Word Wrap" />
            <Badge ok={state.settings?.consoleLineNumbers ?? false} label="Line Numbers" />
          </div>
        </DevSection>

        <DevSection title={`Running Processes (${runningProfiles.length})`}>
          {runningProfiles.length === 0 ? (
            <p className="text-xs font-mono text-text-muted py-2">No processes running</p>
          ) : (
            <div className="space-y-1.5">
              {runningProfiles.map((s) => {
                const profile = state.profiles.find((p) => p.id === s.profileId);
                const uptimeSec = s.startedAt ? Math.floor((Date.now() - s.startedAt) / 1000) : 0;
                return (
                  <div
                    key={s.profileId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-accent/20 bg-accent/5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot shrink-0" />
                    <span className="text-xs font-mono text-text-primary flex-1 truncate">
                      {profile?.name ?? s.profileId}
                    </span>
                    <span className="text-xs font-mono text-text-muted">PID {s.pid}</span>
                    <span className="text-xs font-mono text-text-muted">{uptimeSec}s</span>
                  </div>
                );
              })}
            </div>
          )}
        </DevSection>

        <DevSection title="System">
          {sysInfo ? (
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Platform" value={sysInfo.platform} sub={sysInfo.arch} />
              <StatCard label="Memory" value={`${sysInfo.memoryUsageMB} MB`} />
              <StatCard label="Node.js" value={sysInfo.nodeVersion} />
              <StatCard label="Electron" value={sysInfo.electronVersion} />
            </div>
          ) : (
            <p className="text-xs font-mono text-text-muted animate-pulse">Loading...</p>
          )}
        </DevSection>
      </div>
    </div>
  );
}

function DevSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-base-900 px-4 py-3 space-y-1">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-lg font-mono font-semibold text-text-primary">{value}</p>
      {sub && <p className="text-xs font-mono text-text-muted">{sub}</p>}
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border',
        ok
          ? 'bg-accent/10 border-accent/20 text-accent'
          : 'bg-surface-raised border-surface-border text-text-muted',
      ].join(' ')}
    >
      {ok ? <VscCircleFilled size={8} /> : <VscCircle size={8} />}
      {label}
    </span>
  );
}
