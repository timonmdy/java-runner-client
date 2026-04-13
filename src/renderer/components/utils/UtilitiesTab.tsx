import { useState } from 'react';
import { LuScanLine } from 'react-icons/lu';
import { VscListUnordered } from 'react-icons/vsc';
import { useTranslation } from '../../i18n/I18nProvider';
import { TabBar } from '../common/layout/navigation';
import { ActivityLogPanel } from './ActivityLogPanel';
import { ScannerPanel } from './ScannerPanel';

type Panel = 'log' | 'scanner';

export function UtilitiesTab() {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>('log');

  const PANELS = [
    { id: 'log', label: t('utilities.activityLog'), Icon: VscListUnordered },
    { id: 'scanner', label: t('utilities.processScanner'), Icon: LuScanLine },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <TabBar tabs={PANELS} active={panel} onChange={(id) => setPanel(id as Panel)} />

      <div className="flex-1 min-h-0 overflow-hidden">
        {panel === 'log' && <ActivityLogPanel />}
        {panel === 'scanner' && <ScannerPanel />}
      </div>
    </div>
  );
}
