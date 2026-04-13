import React from 'react';

interface ScrollContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollContent({ children, className }: ScrollContentProps) {
  return (
    <div
      className={['flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
