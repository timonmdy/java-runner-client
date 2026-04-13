import { JRCEnvironment } from '@shared/types/App.types';
import { useEffect, useState } from 'react';
import { VscCircle, VscCircleFilled } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { Badge, StatusDot } from '../common/display';
import { Card, DataRow, ScrollContent, Section } from '../common/layout/containers';

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

// ─── Feature flag registry ────────────────────────────────────────────────────
// Add new flags here — they'll appear automatically in the dashboard.

interface FeatureFlag {
  label: string;
  enabled: () => boolean;
}

function useFeatureFlags(): FeatureFlag[] {
  const { state } = useApp();
  const s = state.settings;

  return [
    { label: 'REST API', enabled: () => s?.restApiEnabled ?? false },
    { label: 'Launch on Startup', enabled: () => s?.launchOnStartup ?? false },
    { label: 'Start Minimized', enabled: () => s?.startMinimized ?? false },
    { label: 'Minimize to Tray', enabled: () => s?.minimizeToTray ?? false },
    { label: 'Dev Mode', enabled: () => s?.devModeEnabled ?? false },
    { label: 'Word Wrap', enabled: () => s?.consoleWordWrap ?? false },
    { label: 'Line Numbers', enabled: () => s?.consoleLineNumbers ?? false },
    { label: 'Timestamps', enabled: () => s?.consoleTimestamps ?? false },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DevDashboard() {
  const { state } = useApp();
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [env, setEnv] = useState<JRCEnvironment>();
  const flags = useFeatureFlags();

  useEffect(() => {
    const load = () => jrc.api.getSysInfo().then(setSysInfo);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    jrc.env.get().then(setEnv);
  }, []);

  const runningProfiles = state.processStates.filter((s) => s.running);
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';

  return (
    <ScrollContent>
      {/* ── Versions ─────────────────────────────────────── */}
      <Section title="Versions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="App" value={`v${appVersion}`} />
          <StatCard label="Electron" value={sysInfo?.electronVersion ?? '...'} />
          <StatCard label="Chrome" value={sysInfo?.chromeVersion ?? '...'} />
          <StatCard label="Node.js" value={sysInfo?.nodeVersion ?? '...'} />
        </div>
      </Section>

      {/* ── Environment ──────────────────────────────────── */}
      <Section title="Environment">
        <Card divided>
          <DataRow
            label="Platform"
            value={sysInfo ? `${sysInfo.platform} (${sysInfo.arch})` : '...'}
          />
          <DataRow label="Type" value={env?.type ?? '...'} mono />
          <DataRow label="Launch Context" value={env?.launchContext ?? '...'} mono />
          <DataRow label="Process Uptime" value={sysInfo ? formatUptime(sysInfo.uptime) : '...'} />
          <DataRow label="Main Memory" value={sysInfo ? `${sysInfo.memoryUsageMB} MB` : '...'} />
        </Card>
      </Section>

      {/* ── Process Argv ─────────────────────────────────── */}
      {sysInfo && sysInfo.argv.length > 0 && (
        <Section title="Process Argv" collapsible defaultCollapsed>
          <Card className="p-3">
            <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
              {sysInfo.argv.join(' ')}
            </p>
          </Card>
        </Section>
      )}

      {/* ── Feature Flags ────────────────────────────────── */}
      <Section title={`Feature Flags (${flags.filter((f) => f.enabled()).length}/${flags.length})`}>
        <div className="flex flex-wrap gap-2">
          {flags.map((flag) => {
            const on = flag.enabled();
            return (
              <Badge
                key={flag.label}
                label={flag.label}
                variant={on ? 'success' : 'default'}
                icon={on ? <VscCircleFilled size={8} /> : <VscCircle size={8} />}
              />
            );
          })}
        </div>
      </Section>

      {/* ── Running Processes ────────────────────────────── */}
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
                  <span className="text-xs font-mono text-text-muted">
                    {formatUptime(uptimeSec)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </ScrollContent>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3 space-y-1">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-lg font-mono font-semibold text-text-primary">{value}</p>
    </Card>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
