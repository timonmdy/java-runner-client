import React from 'react';

interface CardProps {
  children: React.ReactNode;
  /** Show dividers between direct children */
  divided?: boolean;
  className?: string;
}

export function Card({ children, divided, className }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-surface-border bg-base-900',
        divided ? 'divide-y divide-surface-border/50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
