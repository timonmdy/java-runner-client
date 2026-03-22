import React from 'react';
import { Toggle } from '../common/Toggle';
import { Profile } from '../../../main/shared/types/Profile.types';

interface Props {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
  running: boolean;
  onRestart: () => void;
}

export function GeneralSection({ draft, update, running, onRestart }: Props) {
  return (
    <div className="space-y-6">
      <ConfigSection title="Auto-start">
        <ToggleRow
          label="Auto-start on app launch"
          hint="Automatically run this profile when JRC starts"
          checked={draft.autoStart}
          onChange={(v) => update({ autoStart: v })}
        />
      </ConfigSection>

      <ConfigSection title="Auto-restart">
        <ToggleRow
          label="Automatically restart JAR on crash"
          hint="Restarts the process if it exits with a non-zero code"
          checked={draft.autoRestart ?? false}
          onChange={(v) => update({ autoRestart: v })}
        />
        {draft.autoRestart && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
            <div>
              <p className="text-xs text-text-primary font-medium">Restart delay</p>
              <p className="text-xs text-text-muted mt-0.5">Seconds to wait before restarting</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={3600}
                value={draft.autoRestartInterval ?? 10}
                onChange={(e) =>
                  update({ autoRestartInterval: Math.max(1, parseInt(e.target.value) || 10) })
                }
                className="w-20 bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary text-right focus:outline-none focus:border-accent/40"
              />
              <span className="text-xs text-text-muted font-mono">sec</span>
            </div>
          </div>
        )}
      </ConfigSection>

      {running && (
        <ConfigSection title="Process">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-surface-border bg-base-900 text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
          >
            Restart process
          </button>
        </ConfigSection>
      )}
    </div>
  );
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
      <div>
        <p className="text-xs text-text-primary font-medium">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
