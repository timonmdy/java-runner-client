import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { useApp } from '../../AppProvider';
import { VscRefresh, VscTrash } from 'react-icons/vsc';

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

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5">
      <StorageSection title="Electron Store (Persistent)">
        <div className="rounded-lg border border-surface-border bg-base-900 divide-y divide-surface-border/50">
          <StoreRow label="Profiles" value={String(state.profiles.length)} />
          <StoreRow label="Active profile ID" value={state.activeProfileId || '—'} mono />
          <StoreRow
            label="REST API"
            value={
              state.settings?.restApiEnabled
                ? `Enabled (${state.settings.restApiPort})`
                : 'Disabled'
            }
          />
          <StoreRow
            label="Console max lines"
            value={String(state.settings?.consoleMaxLines ?? '—')}
          />
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmReset('electron-store')}>
          <VscTrash size={11} />
          Reset Electron Store
        </Button>
      </StorageSection>

      <StorageSection title={`Session Storage (${formatBytes(totalSessionBytes)})`}>
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
          <div className="rounded-lg border border-surface-border bg-base-900 divide-y divide-surface-border/50">
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
          </div>
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
      </StorageSection>

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
    </div>
  );
}

function StorageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function StoreRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs text-text-muted font-mono w-40 shrink-0">{label}</span>
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
