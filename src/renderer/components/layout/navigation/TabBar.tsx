import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  Icon?: React.ElementType;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  accentColor?: string;
  className?: string;
  dotTab?: string;
}

export function TabBar({
  tabs,
  active,
  onChange,
  accentColor = '#4ade80',
  className = '',
  dotTab,
}: TabBarProps) {
  return (
    <div
      className={[
        'flex items-center px-4 border-b border-surface-border bg-base-900 shrink-0',
        className,
      ].join(' ')}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-all duration-150',
              isActive
                ? 'font-medium'
                : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}
            style={isActive ? { borderBottomColor: accentColor, color: accentColor } : {}}
          >
            {tab.icon}
            {tab.Icon && <tab.Icon size={13} />}
            {tab.label}
            {tab.badge}
            {dotTab === tab.id && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-console-warn align-middle" />
            )}
          </button>
        );
      })}
    </div>
  );
}
