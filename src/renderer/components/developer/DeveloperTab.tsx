import React, { useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { VscDashboard, VscPlug, VscDatabase, VscBeaker } from 'react-icons/vsc';
import { DevDashboard } from './DevDashboard';
import { DevApiExplorer } from './DevApiExplorer';
import { DevStorage } from './DevStorage';
import { DevDiagnostics } from './DevDiagnostics';

type Panel = 'dashboard' | 'api' | 'storage' | 'diagnostics';

export function DeveloperTab() {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>('dashboard');

  const PANELS: { id: Panel; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard', label: t('dev.dashboard'), Icon: VscDashboard },
    { id: 'api', label: t('dev.apiExplorer'), Icon: VscPlug },
    { id: 'storage', label: t('dev.storage'), Icon: VscDatabase },
    { id: 'diagnostics', label: t('dev.diagnostics'), Icon: VscBeaker },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-base-800">
      <div className="shrink-0 px-4 py-2 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
        <span className="text-xs font-mono text-accent tracking-widest uppercase">
          {t('dev.mode')}
        </span>
      </div>

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

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {panel === 'dashboard' && <DevDashboard />}
        {panel === 'api' && <DevApiExplorer />}
        {panel === 'storage' && <DevStorage />}
        {panel === 'diagnostics' && <DevDiagnostics />}
      </div>
    </div>
  );
}
