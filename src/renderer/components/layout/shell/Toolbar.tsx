import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={[
        'flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
