import React, { useState, useCallback } from 'react';
import { useUpdateRegistry } from '../../../hooks/useUpdateRegistry';
import type {
  UpdateStatus,
  UpdateCheckResult,
} from '../../../../main/shared/types/UpdateCenter.types';
import { Button } from '../../common/Button';
import { Section } from '../SettingsRow';
import { VscSync, VscCheck, VscWarning, VscCircleSlash, VscCloudDownload } from 'react-icons/vsc';

interface ItemState {
  status: UpdateStatus;
  result?: UpdateCheckResult;
  error?: string;
}

export function UpdatesSection() {
  const registry = useUpdateRegistry();
  const [items, setItems] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(registry.map((u) => [u.id, { status: 'idle' as UpdateStatus }]))
  );
  const [globalChecking, setGlobalChecking] = useState(false);
  const [globalUpdating, setGlobalUpdating] = useState(false);

  const updateItem = (id: string, patch: Partial<ItemState>) => {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const checkOne = useCallback(
    async (id: string) => {
      const updatable = registry.find((u) => u.id === id);
      if (!updatable) return;
      updateItem(id, { status: 'checking' });
      try {
        const result = await updatable.check();
        updateItem(id, {
          status: result.hasUpdate ? 'update-available' : 'up-to-date',
          result,
          error: result.error,
        });
      } catch (e) {
        updateItem(id, { status: 'error', error: String(e) });
      }
    },
    [registry]
  );

  const applyOne = useCallback(
    async (id: string) => {
      const updatable = registry.find((u) => u.id === id);
      if (!updatable) return;
      updateItem(id, { status: 'updating' });
      try {
        const res = await updatable.apply();
        updateItem(id, { status: res.ok ? 'done' : 'error', error: res.error });
      } catch (e) {
        updateItem(id, { status: 'error', error: String(e) });
      }
    },
    [registry]
  );

  const checkAll = useCallback(async () => {
    setGlobalChecking(true);
    for (const u of registry) await checkOne(u.id);
    setGlobalChecking(false);
  }, [registry, checkOne]);

  const updateAll = useCallback(async () => {
    setGlobalUpdating(true);
    for (const u of registry) {
      if (items[u.id]?.status === 'update-available') await applyOne(u.id);
    }
    setGlobalUpdating(false);
  }, [registry, items, applyOne]);

  const hasAnyUpdate = Object.values(items).some((s) => s.status === 'update-available');
  const allChecked = Object.values(items).every(
    (s) => s.status !== 'idle' && s.status !== 'checking'
  );

  return (
    <Section title="Update Center">
      <div className="flex items-center justify-between gap-4 py-2">
        <p className="text-xs text-text-muted">
          Check for updates to the app, themes, and language packs
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={checkAll} loading={globalChecking}>
            <VscSync size={11} /> Check All
          </Button>
          {hasAnyUpdate && (
            <Button variant="primary" size="sm" onClick={updateAll} loading={globalUpdating}>
              <VscCloudDownload size={11} /> Update All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {registry.map((updatable) => {
          const state = items[updatable.id] ?? { status: 'idle' };
          return (
            <UpdateItem
              key={updatable.id}
              label={updatable.label}
              description={updatable.description}
              state={state}
              onCheck={() => checkOne(updatable.id)}
              onApply={() => applyOne(updatable.id)}
            />
          );
        })}
      </div>

      {allChecked && !hasAnyUpdate && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent/5 animate-fade-in">
          <VscCheck size={13} className="text-accent shrink-0" />
          <p className="text-xs text-text-secondary font-mono">Everything is up to date.</p>
        </div>
      )}
    </Section>
  );
}

function UpdateItem({
  label,
  description,
  state,
  onCheck,
  onApply,
}: {
  label: string;
  description: string;
  state: ItemState;
  onCheck: () => void;
  onApply: () => void;
}) {
  const { status, result, error } = state;

  const StatusIcon = {
    idle: () => <VscSync size={12} className="text-text-muted" />,
    checking: () => <VscSync size={12} className="text-text-muted animate-spin" />,
    'up-to-date': () => <VscCheck size={12} className="text-accent" />,
    'update-available': () => <VscWarning size={12} className="text-yellow-400" />,
    updating: () => <VscSync size={12} className="text-accent animate-spin" />,
    done: () => <VscCheck size={12} className="text-accent" />,
    error: () => <VscCircleSlash size={12} className="text-red-400" />,
  }[status];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-base-900/50">
      <div className="shrink-0">
        <StatusIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary">{label}</p>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">
          {status === 'up-to-date' && result && `v${result.currentVersion} -- latest`}
          {status === 'update-available' &&
            result &&
            `v${result.currentVersion} -> v${result.remoteVersion}`}
          {status === 'done' && 'Updated successfully'}
          {status === 'error' && (error ?? 'Check failed')}
          {status === 'idle' && description}
          {status === 'checking' && 'Checking...'}
          {status === 'updating' && 'Applying update...'}
        </p>
      </div>
      <div className="shrink-0">
        {(status === 'idle' || status === 'error' || status === 'up-to-date') && (
          <button
            onClick={onCheck}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
          >
            <VscSync size={11} />
            {status === 'error' ? 'Retry' : 'Check'}
          </button>
        )}
        {status === 'update-available' && (
          <Button variant="primary" size="sm" onClick={onApply}>
            Update
          </Button>
        )}
      </div>
    </div>
  );
}
