import React from 'react';

export interface TabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface Props {
  tabs: TabDef[];
  activeId: string;
  onSelect: (id: string) => void;
  accentColor?: string;
  className?: string;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  accentColor = '#4ade80',
  className = '',
}: Props) {
  return (
    <div
      className={[
        'flex items-center px-4 border-b border-surface-border bg-base-900 shrink-0',
        className,
      ].join(' ')}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-all duration-150',
              isActive
                ? 'font-medium'
                : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}
            style={isActive ? { borderBottomColor: accentColor, color: accentColor } : {}}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
