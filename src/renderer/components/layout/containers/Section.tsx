import React, { useState } from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
  /** Render dividers between children (used for settings rows) */
  divided?: boolean;
  /** Allow collapsing the section */
  collapsible?: boolean;
  /** Start collapsed (requires collapsible) */
  defaultCollapsed?: boolean;
}

export function Section({
  title,
  hint,
  children,
  divided,
  collapsible = false,
  defaultCollapsed = false,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);

  return (
    <div>
      <button
        type="button"
        onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
        className={[
          'flex items-center gap-1.5 text-xs font-mono text-text-muted uppercase tracking-widest',
          collapsible
            ? 'cursor-pointer hover:text-text-secondary transition-colors'
            : 'cursor-default',
        ].join(' ')}
      >
        {collapsible && (
          <span className="transition-transform duration-150">
            {collapsed ? <VscChevronRight size={12} /> : <VscChevronDown size={12} />}
          </span>
        )}
        {title}
      </button>
      {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      {!collapsed && (
        <div className={divided ? 'mt-4 space-y-0 divide-y divide-surface-border/50' : 'mt-2'}>
          {children}
        </div>
      )}
    </div>
  );
}
