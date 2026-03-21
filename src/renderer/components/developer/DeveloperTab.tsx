import React, { useState } from 'react';
import { VscDashboard, VscPlug, VscDatabase, VscBeaker } from 'react-icons/vsc';
import { DevDashboard } from './DevDashboard';
import { DevApiExplorer } from './DevApiExplorer';
import { DevStorage } from './DevStorage';
import { DevDiagnostics } from './DevDiagnostics';

type Panel = 'dashboard' | 'api' | 'storage' | 'diagnostics';

const PANELS: { id: Panel; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: VscDashboard },
  { id: 'api', label: 'API Explorer', Icon: VscPlug },
  { id: 'storage', label: 'Storage', Icon: VscDatabase },
  { id: 'diagnostics', label: 'Diagnostics', Icon: VscBeaker },
];

export function DeveloperTab() {
  const [panel, setPanel] = useState<Panel>('dashboard');

  return (
    <div className="flex flex-col h-full bg-base-800">
      {/* Header banner */}
      <div className="shrink-0 px-4 py-2 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
        <span className="text-xs font-mono text-accent tracking-widest uppercase">
          Developer Mode
        </span>
      </div>

      {/* Sub-tab bar */}
      <div className="flex items-center gap-0 px-4 border-b border-surface-border bg-base-900 shrink-0">
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPanel(p.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono border-b-2 -mb-px transition-colors',
              panel === p.id
                ? 'text-accent border-accent font-medium'
                : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}
          >
            <p.Icon size={13} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {panel === 'dashboard' && <DevDashboard />}
        {panel === 'api' && <DevApiExplorer />}
        {panel === 'storage' && <DevStorage />}
        {panel === 'diagnostics' && <DevDiagnostics />}
      </div>
    </div>
  );
}
