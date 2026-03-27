import React, { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { EmptyState } from '../common/EmptyState';
import { VscCheck } from 'react-icons/vsc';
import { LuScanLine } from 'react-icons/lu';
import { JavaProcessInfo } from '../../../main/shared/types/Process.types';

type Filter = 'java' | 'all';
interface KillIntent {
  proc: JavaProcessInfo;
  nonJava: boolean;
}

export function ScannerPanel() {
  const { t } = useTranslation();
  const [results, setResults] = useState<JavaProcessInfo[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [killIntent, setKillIntent] = useState<KillIntent | null>(null);
  const [killAllConfirm, setKillAllConfirm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [killedPids, setKilledPids] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<Filter>('java');
  const [search, setSearch] = useState('');
  const [expandedPid, setExpandedPid] = useState<number | null>(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setStatusMsg(null);
    setKilledPids(new Set());
    setSearch('');
    setExpandedPid(null);
    const found = await window.api.scanAllProcesses();
    setResults(found);
    setScanning(false);
    const javaCount = found.filter((p) => p.isJava).length;
    setStatusMsg({
      text: t('scanner.foundProcesses', {
        count: String(found.length),
        javaCount: String(javaCount),
      }),
      ok: true,
    });
  }, []);

  const handleKill = async () => {
    if (!killIntent) return;
    const res = await window.api.killPid(killIntent.proc.pid);
    if (res.ok) {
      setKilledPids((prev) => new Set([...prev, killIntent.proc.pid]));
      setStatusMsg({
        text: t('scanner.killedPid', { pid: String(killIntent.proc.pid) }),
        ok: true,
      });
    } else {
      setStatusMsg({
        text: t('scanner.killFailed', { pid: String(killIntent.proc.pid), error: res.error ?? '' }),
        ok: false,
      });
    }
    setKillIntent(null);
  };

  const handleKillAll = async () => {
    const res = await window.api.killAllJava();
    setStatusMsg({
      text:
        res.killed === 1
          ? t('scanner.killedAll', { killed: String(res.killed) })
          : t('scanner.killedAllPlural', { killed: String(res.killed) }),
      ok: true,
    });
    setKillAllConfirm(false);
    setTimeout(scan, 800);
  };

  const searchLower = search.trim().toLowerCase();
  const visible = results
    ? (filter === 'java' ? results.filter((r) => r.isJava) : results)
        .filter((r) => !killedPids.has(r.pid))
        .filter(
          (r) =>
            !searchLower ||
            r.command.toLowerCase().includes(searchLower) ||
            String(r.pid).includes(searchLower)
        )
    : null;

  const killableJavaVisible = visible?.some((r) => r.isJava && !r.protected) ?? false;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900/50 shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-1 bg-base-950 rounded-lg p-0.5 border border-surface-border">
          {(['java', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-2.5 py-1 text-xs rounded-md transition-colors font-mono',
                filter === f
                  ? 'bg-surface-raised text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {f === 'java' ? t('scanner.javaOnly') : t('scanner.all')}
            </button>
          ))}
        </div>
        {results !== null && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('scanner.searchPlaceholder')}
            className="h-7 bg-base-950 border border-surface-border rounded-md px-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 w-48"
          />
        )}
        <div className="flex-1" />
        {killableJavaVisible && (
          <Button variant="danger" size="sm" onClick={() => setKillAllConfirm(true)}>
            {t('scanner.killAll')}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={scan} loading={scanning}>
          {results === null ? t('scanner.scan') : t('scanner.rescan')}
        </Button>
      </div>

      {statusMsg && (
        <div
          className={[
            'mx-4 mt-2 shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border animate-fade-in',
            statusMsg.ok
              ? 'bg-surface-raised border-surface-border text-text-secondary'
              : 'bg-red-500/10 border-red-500/20 text-red-400',
          ].join(' ')}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
        {results === null && !scanning && (
          <EmptyState icon={<LuScanLine size={28} />} text={t('scanner.scanHint')} />
        )}
        {scanning && (
          <p className="text-xs text-text-muted font-mono py-8 text-center animate-pulse">
            {t('scanner.scanning')}
          </p>
        )}
        {visible !== null && visible.length === 0 && !scanning && (
          <EmptyState
            icon={<VscCheck size={28} />}
            text={filter === 'java' ? t('scanner.noJava') : t('scanner.noProcesses')}
          />
        )}
        {visible !== null && visible.length > 0 && (
          <div className="space-y-1.5">
            {visible.map((proc) => (
              <ProcessRow
                key={proc.pid}
                proc={proc}
                expanded={expandedPid === proc.pid}
                onToggle={() => setExpandedPid(expandedPid === proc.pid ? null : proc.pid)}
                onKill={() => setKillIntent({ proc, nonJava: !proc.isJava })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!killIntent}
        title={
          killIntent?.proc.protected
            ? t('scanner.killProtectedTitle')
            : killIntent?.nonJava
              ? t('scanner.killNonJavaTitle')
              : t('scanner.killPidTitle', { pid: String(killIntent?.proc.pid ?? '') })
        }
        message={
          killIntent?.proc.protected
            ? t('scanner.killProtectedMessage', {
                command: (killIntent?.proc.command ?? '').slice(0, 120),
              })
            : killIntent?.nonJava
              ? t('scanner.killNonJavaMessage', {
                  command: (killIntent?.proc.command ?? '').slice(0, 120),
                })
              : t('scanner.killPidMessage', {
                  pid: String(killIntent?.proc.pid ?? ''),
                  command: (killIntent?.proc.command ?? '').slice(0, 120),
                })
        }
        confirmLabel={
          killIntent?.proc.protected || killIntent?.nonJava
            ? t('scanner.killAnyway')
            : t('scanner.killProcess')
        }
        danger
        onConfirm={handleKill}
        onCancel={() => setKillIntent(null)}
      />

      <Dialog
        open={killAllConfirm}
        title={t('scanner.killAllTitle')}
        message={t('scanner.killAllMessage')}
        confirmLabel={t('scanner.killAllLabel')}
        danger
        onConfirm={handleKillAll}
        onCancel={() => setKillAllConfirm(false)}
      />
    </div>
  );
}

function ProcessRow({
  proc,
  expanded,
  onToggle,
  onKill,
}: {
  proc: JavaProcessInfo;
  expanded: boolean;
  onToggle: () => void;
  onKill: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        'rounded-lg border transition-colors overflow-hidden',
        proc.protected
          ? 'border-surface-border/50 bg-base-900/20 opacity-50'
          : proc.isJava
            ? 'border-accent/20 bg-accent/5'
            : 'border-surface-border bg-base-900/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onToggle}
          className="text-text-muted hover:text-text-primary transition-colors shrink-0"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={['transition-transform', expanded ? 'rotate-90' : ''].join(' ')}
          >
            <polyline points="3,2 7,5 3,8" />
          </svg>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {proc.protected && <Badge label={t('scanner.protectedLabel')} />}
          {proc.managed && <Badge label={t('scanner.managedBadge')} accent />}
          {proc.isJava ? (
            <Badge label={t('scanner.javaBadge')} blue />
          ) : (
            <Badge label={t('scanner.nonJavaBadge')} />
          )}
        </div>
        <code
          className={[
            'text-xs font-mono shrink-0 w-14',
            proc.isJava && !proc.protected ? 'text-accent' : 'text-text-muted',
          ].join(' ')}
        >
          {proc.pid}
        </code>
        <span
          className="text-xs font-mono text-text-secondary truncate flex-1 min-w-0"
          title={proc.command}
        >
          {proc.jarName ?? proc.name ?? proc.command.slice(0, 60)}
        </span>
        {proc.memoryMB !== undefined && (
          <span className="text-xs font-mono text-text-muted shrink-0">{proc.memoryMB} MB</span>
        )}
        <Button variant="danger" size="sm" onClick={onKill}>
          {t('scanner.kill')}
        </Button>
      </div>
      {expanded && (
        <div className="px-10 pb-3 pt-1 border-t border-surface-border/50 space-y-1.5 animate-fade-in">
          <DetailRow label={t('scanner.fullCommand')} value={proc.command} mono wrap />
          {proc.jarName && <DetailRow label="JAR" value={proc.jarName} />}
          {proc.memoryMB !== undefined && (
            <DetailRow label={t('scanner.memory')} value={`${proc.memoryMB} MB`} />
          )}
          {proc.threads !== undefined && (
            <DetailRow label={t('scanner.threads')} value={String(proc.threads)} />
          )}
          {proc.startTime && <DetailRow label={t('scanner.started')} value={proc.startTime} />}
          <DetailRow
            label={t('scanner.managedByJrc')}
            value={proc.managed ? t('general.yes') : t('general.no')}
          />
          <DetailRow
            label={t('scanner.protectedLabel')}
            value={proc.protected ? t('scanner.protectedYes') : t('general.no')}
          />
        </div>
      )}
    </div>
  );
}

function Badge({ label, accent, blue }: { label: string; accent?: boolean; blue?: boolean }) {
  return (
    <span
      className={[
        'px-1.5 py-0.5 rounded text-xs font-mono border',
        accent
          ? 'bg-accent/15 text-accent border-accent/30'
          : blue
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-surface-raised text-text-muted border-surface-border',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
  mono,
  wrap,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="text-text-muted font-mono w-28 shrink-0">{label}</span>
      <span
        className={[
          mono ? 'font-mono' : '',
          wrap ? 'break-all' : 'truncate',
          'text-text-secondary flex-1',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
