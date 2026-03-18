import React, { useState } from 'react'
import { VscListUnordered } from 'react-icons/vsc'
import { LuScanLine } from 'react-icons/lu'
import { ActivityLogPanel } from './ActivityLogPanel'
import { ScannerPanel }     from './ScannerPanel'

type Panel = 'log' | 'scanner'

const PANELS: { id: Panel; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'log',     label: 'Activity Log',    Icon: VscListUnordered },
  { id: 'scanner', label: 'Process Scanner', Icon: LuScanLine },
]

export function UtilitiesTab() {
  const [panel, setPanel] = useState<Panel>('log')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0 px-4 border-b border-surface-border bg-base-900 shrink-0">
        {PANELS.map(p => (
          <button
            key={p.id}
            onClick={() => setPanel(p.id)}
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

      <div className="flex-1 overflow-hidden">
        {panel === 'log'     && <ActivityLogPanel />}
        {panel === 'scanner' && <ScannerPanel />}
      </div>
    </div>
  )
}
