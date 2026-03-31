import { useEffect, useState } from 'react';
import { VscRefresh, VscTrash } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { Button } from '../common/inputs';
import { Dialog } from '../common/overlays';
import { Card, DataRow, ScrollContent, Section } from '../layout/containers';

interface SessionEntry {
  key: string;
  sizeBytes: number;
  preview: string;
}

function getSessionEntries(): SessionEntry[] {
  const entries: SessionEntry[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)!;
    const raw = sessionStorage.getItem(key) ?? '';
    entries.push({
      key,
      sizeBytes: new Blob([raw]).size,
      preview: raw.slice(0, 80) + (raw.length > 80 ? '...' : ''),
    });
  }
  return entries.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export function DevStorage() {
  const { state } = useApp();
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);
  const [confirmReset, setConfirmReset] = useState<'electron-store' | 'session' | null>(null);

  const refresh = () => setSessionEntries(getSessionEntries());
  useEffect(() => {
    refresh();
  }, []);

  const totalSessionBytes = sessionEntries.reduce((a, b) => a + b.sizeBytes, 0);
  const profilesWithLogging = state.profiles.filter((p) => p.fileLogging).length;

  return (
    <ScrollContent>
      <Section title="Electron Store (Persistent)">
        <Card divided>
          <DataRow label="Profiles" value={String(state.profiles.length)} />
          <DataRow label="Active profile ID" value={state.activeProfileId || '---'} mono />
          <DataRow
            label="REST API"
            value={
              state.settings?.restApiEnabled
                ? `Enabled (${state.settings.restApiPort})`
                : 'Disabled'
            }
          />
          <DataRow
            label="Console max lines"
            value={String(state.settings?.consoleMaxLines ?? '---')}
          />
          <DataRow
            label="Console timestamps"
            value={state.settings?.consoleTimestamps ? 'Enabled' : 'Disabled'}
          />
          <DataRow
            label="File logging profiles"
            value={`${profilesWithLogging} / ${state.profiles.length}`}
          />
        </Card>
        <Button variant="danger" size="sm" onClick={() => setConfirmReset('electron-store')}>
          <VscTrash size={11} />
          Reset Electron Store
        </Button>
      </Section>

      <Section title={`Session Storage (${formatBytes(totalSessionBytes)})`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted font-mono">{sessionEntries.length} keys</p>
          <button
            onClick={refresh}
            className="text-text-muted hover:text-accent transition-colors p-1"
          >
            <VscRefresh size={12} />
          </button>
        </div>
        {sessionEntries.length === 0 ? (
          <p className="text-xs font-mono text-text-muted py-2">Empty</p>
        ) : (
          <Card divided>
            {sessionEntries.map((e) => (
              <div key={e.key} className="px-3 py-2 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-text-primary truncate">{e.key}</p>
                  <p className="text-xs font-mono text-text-muted truncate mt-0.5">{e.preview}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-text-muted">
                    {formatBytes(e.sizeBytes)}
                  </span>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem(e.key);
                      refresh();
                    }}
                    className="text-text-muted hover:text-red-400 transition-colors"
                  >
                    <VscTrash size={11} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={() => setConfirmReset('session')}
          disabled={sessionEntries.length === 0}
        >
          <VscTrash size={11} />
          Clear Session Storage
        </Button>
      </Section>

      <Dialog
        open={confirmReset === 'electron-store'}
        title="Reset Electron Store?"
        message="This will wipe ALL profiles and settings permanently. The app will need to be restarted. This cannot be undone."
        confirmLabel="Reset"
        danger
        onConfirm={async () => {
          await window.api.resetStore();
          setConfirmReset(null);
        }}
        onCancel={() => setConfirmReset(null)}
      />
      <Dialog
        open={confirmReset === 'session'}
        title="Clear Session Storage?"
        message="All cached console logs for this session will be removed. Running processes are not affected."
        confirmLabel="Clear"
        danger
        onConfirm={() => {
          sessionStorage.clear();
          refresh();
          setConfirmReset(null);
        }}
        onCancel={() => setConfirmReset(null)}
      />
    </ScrollContent>
  );
}
