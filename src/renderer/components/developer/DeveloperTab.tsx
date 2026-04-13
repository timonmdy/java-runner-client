import { useState } from 'react';
import { VscBeaker, VscDashboard, VscDatabase, VscPlug, VscSymbolColor } from 'react-icons/vsc';
import { useTranslation } from '../../i18n/I18nProvider';
import { StatusDot } from '../common/display';
import { TabBar } from '../common/layout/navigation';
import { DevApiExplorer } from './DevApiExplorer';
import { DevAssets } from './DevAssets';
import { DevDashboard } from './DevDashboard';
import { DevDiagnostics } from './DevDiagnostics';
import { DevStorage } from './DevStorage';

type Panel = 'dashboard' | 'api' | 'storage' | 'diagnostics' | 'assets';

export function DeveloperTab() {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>('dashboard');

  const PANELS = [
    { id: 'dashboard', label: t('dev.dashboard'), Icon: VscDashboard },
    { id: 'api', label: t('dev.apiExplorer'), Icon: VscPlug },
    { id: 'storage', label: t('dev.storage'), Icon: VscDatabase },
    { id: 'diagnostics', label: t('dev.diagnostics'), Icon: VscBeaker },
    { id: 'assets', label: t('dev.assets'), Icon: VscSymbolColor },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-base-800">
      <div className="shrink-0 px-4 py-2 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
        <StatusDot pulse />
        <span className="text-xs font-mono text-accent tracking-widest uppercase">
          {t('dev.mode')}
        </span>
      </div>

      <TabBar tabs={PANELS} active={panel} onChange={(id) => setPanel(id as Panel)} />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {panel === 'dashboard' && <DevDashboard />}
        {panel === 'api' && <DevApiExplorer />}
        {panel === 'storage' && <DevStorage />}
        {panel === 'diagnostics' && <DevDiagnostics />}
        {panel === 'assets' && <DevAssets />}
      </div>
    </div>
  );
}
