import React from 'react';

type BadgeVariant = 'default' | 'accent' | 'blue' | 'success' | 'danger';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-raised text-text-muted border-surface-border',
  accent: 'bg-accent/15 text-accent border-accent/30',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  success: 'bg-accent/10 border-accent/20 text-accent',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'default', icon }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-mono border',
        VARIANT_CLASSES[variant],
      ].join(' ')}
    >
      {icon}
      {label}
    </span>
  );
}
