import { useState } from 'react';
import { LuScanLine } from 'react-icons/lu';
import { VscListUnordered } from 'react-icons/vsc';
import { useTranslation } from '../../i18n/I18nProvider';
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
      <div className="flex items-center gap-0 px-4 border-b border-surface-border bg-base-900 shrink-0">
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPanel(p.id as Panel)}
            className={[
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono border-b-2 -mb-px transition-colors',
              panel === p.id
                ? 'text-text-primary border-text-muted font-medium'
                : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}
          >
            <p.Icon size={13} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {panel === 'log' && <ActivityLogPanel />}
        {panel === 'scanner' && <ScannerPanel />}
      </div>
    </div>
  );
}
