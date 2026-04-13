import { useEffect, useState } from 'react';
import { VscFolderOpened, VscRefresh, VscTrash } from 'react-icons/vsc';
import { Button } from '../common/inputs';
import { Card, ScrollContent, Section } from '../common/layout/containers';
import { Dialog } from '../common/overlays';

// ─── Session Storage helpers ──────────────────────────────────────────────────

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
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DevStorage() {
  const [storeJson, setStoreJson] = useState<string | null>(null);
  const [storeSize, setStoreSize] = useState(0);
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);
  const [confirmReset, setConfirmReset] = useState<'electron-store' | 'session' | null>(null);

  const refreshStore = () =>
    jrc.api.getStoreJson().then((json: string) => {
      setStoreJson(json);
      setStoreSize(new Blob([json]).size);
    });

  const refreshSession = () => setSessionEntries(getSessionEntries());

  useEffect(() => {
    refreshStore();
    refreshSession();
  }, []);

  const totalSessionBytes = sessionEntries.reduce((a, b) => a + b.sizeBytes, 0);

  let formattedJson = '';
  try {
    formattedJson = JSON.stringify(JSON.parse(storeJson ?? '{}'), null, 2);
  } catch {
    formattedJson = storeJson ?? '';
  }

  return (
    <ScrollContent>
      {/* ── Electron Store (JSON Viewer) ─────────────────── */}
      <Section title={`Electron Store (${formatBytes(storeSize)})`}>
        <Card className="flex flex-col">
          <div className="max-h-80 overflow-auto scrollbar-thin">
            {storeJson === null ? (
              <p className="text-xs font-mono text-text-muted p-3 animate-pulse">Loading...</p>
            ) : (
              <pre className="text-[11px] font-mono text-text-secondary p-3 leading-5 select-text whitespace-pre">
                {formattedJson}
              </pre>
            )}
          </div>
        </Card>
        <div className="flex items-center gap-2 mt-1">
          <Button variant="ghost" size="sm" onClick={refreshStore}>
            <VscRefresh size={11} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => jrc.api.openStoreFile()}>
            <VscFolderOpened size={11} />
            Open in Explorer
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmReset('electron-store')}>
            <VscTrash size={11} />
            Reset Store
          </Button>
        </div>
      </Section>

      {/* ── Session Storage ──────────────────────────────── */}
      <Section title={`Session Storage (${formatBytes(totalSessionBytes)})`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted font-mono">{sessionEntries.length} keys</p>
          <button
            onClick={refreshSession}
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
                      refreshSession();
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

      {/* ── Dialogs ──────────────────────────────────────── */}
      <Dialog
        open={confirmReset === 'electron-store'}
        title="Reset Electron Store?"
        message="This will wipe ALL profiles and settings permanently. The app will need to be restarted. This cannot be undone."
        confirmLabel="Reset"
        danger
        onConfirm={async () => {
          await jrc.api.resetStore();
          setConfirmReset(null);
          refreshStore();
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
          refreshSession();
          setConfirmReset(null);
        }}
        onCancel={() => setConfirmReset(null)}
      />
    </ScrollContent>
  );
}
