import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { EmptyState } from '../common/EmptyState';
import { VscListUnordered } from 'react-icons/vsc';
import { ProcessLogEntry } from '../../../main/shared/types/Process.types';

export function ActivityLogPanel() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ProcessLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setEntries(await window.api.getProcessLog());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900/50 shrink-0">
          <p className="text-xs text-text-muted flex-1">{t('activity.description')}</p>
          <Button variant="ghost" size="sm" onClick={load} loading={loading}>
            {t('general.refresh')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={!entries || entries.length === 0}
          >
            {t('general.clear')}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
          {loading && !entries && (
            <p className="text-xs text-text-muted py-8 text-center font-mono">
              {t('general.loading')}
            </p>
          )}
          {entries && entries.length === 0 && (
            <EmptyState icon={<VscListUnordered size={28} />} text={t('activity.empty')} />
          )}
          {entries && entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((e) => (
                <LogEntryRow key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={confirmClear}
        title={t('activity.clearTitle')}
        message={t('activity.clearMessage')}
        confirmLabel={t('general.clear')}
        danger
        onConfirm={async () => {
          await window.api.clearProcessLog();
          setEntries([]);
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}

function LogEntryRow({ entry }: { entry: ProcessLogEntry }) {
  const { t } = useTranslation();
  const duration = entry.stoppedAt ? formatDuration(entry.stoppedAt - entry.startedAt) : null;
  const jarName = entry.jarPath.split(/[/\\]/).pop() ?? entry.jarPath;
  return (
    <div className="rounded-lg border border-surface-border bg-base-900 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium text-text-primary">{entry.profileName}</span>
            <code className="font-mono text-xs text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
              PID {entry.pid}
            </code>
            {entry.stoppedAt ? (
              <span className="text-xs text-text-muted">{t('activity.stopped')}</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
                {t('activity.running')}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted font-mono truncate" title={entry.jarPath}>
            {jarName}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs text-text-muted font-mono">{formatTime(entry.startedAt)}</p>
          {duration && <p className="text-xs text-text-muted/60 font-mono">{duration}</p>}
          {entry.exitCode !== undefined && (
            <p
              className={[
                'text-xs font-mono',
                entry.exitCode === 0 ? 'text-accent' : 'text-console-error',
              ].join(' ')}
            >
              exit {entry.exitCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
