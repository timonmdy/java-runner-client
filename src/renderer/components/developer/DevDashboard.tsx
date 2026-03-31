import { JRCEnvironment } from '@shared/types/App.types';
import { useEffect, useState } from 'react';
import { VscCircle, VscCircleFilled } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { Badge, StatusDot } from '../common/display';
import { Card, ScrollContent, Section } from '../layout/containers';

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
    <ScrollContent>
      <Section title="Environment">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Start-Source" value={env?.startUpSource ?? 'undefined'} />
          <StatCard label="Type (env)" value={env?.type ?? 'undefined'} />
        </div>
      </Section>

      {sysInfo && (
        <Card className="p-3">
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">
            Process Argv
          </p>
          <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
            {sysInfo.argv.join(' ')}
          </p>
        </Card>
      )}

      <Section title="Feature Flags">
        <div className="flex flex-wrap gap-2">
          <FeatureBadge ok={restEnabled} label="REST API" />
          <FeatureBadge ok={state.settings?.launchOnStartup ?? false} label="Launch on Startup" />
          <FeatureBadge ok={state.settings?.minimizeToTray ?? false} label="Minimize to Tray" />
          <FeatureBadge ok={state.settings?.consoleWordWrap ?? false} label="Word Wrap" />
          <FeatureBadge ok={state.settings?.consoleLineNumbers ?? false} label="Line Numbers" />
        </div>
      </Section>

      <Section title={`Running Processes (${runningProfiles.length})`}>
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
                  <StatusDot pulse />
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
      </Section>

      <Section title="System">
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
      </Section>
    </ScrollContent>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="px-4 py-3 space-y-1">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-lg font-mono font-semibold text-text-primary">{value}</p>
      {sub && <p className="text-xs font-mono text-text-muted">{sub}</p>}
    </Card>
  );
}

function FeatureBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      label={label}
      variant={ok ? 'success' : 'default'}
      icon={ok ? <VscCircleFilled size={8} /> : <VscCircle size={8} />}
    />
  );
}
