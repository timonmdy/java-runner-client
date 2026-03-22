import React from 'react';

interface Props {
  icon: React.ReactNode;
  text: string;
}

export function EmptyState({ icon, text }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
      {icon}
      <p className="text-xs font-mono text-center max-w-xs leading-relaxed">{text}</p>
    </div>
  );
}
