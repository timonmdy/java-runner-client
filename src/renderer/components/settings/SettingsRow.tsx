import React from 'react';
import { Section } from '../layout/containers';

export { Section };

export function Row({
  label,
  hint,
  sub,
  children,
}: {
  label: string;
  hint?: string;
  sub?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={['flex items-center justify-between gap-6 py-3.5', sub ? 'pl-5' : ''].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <p className={sub ? 'text-sm text-text-secondary' : 'text-sm text-text-primary'}>{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5 leading-4">{hint}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-surface-border" />;
}

export function NumInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-24 bg-transparent border border-surface-border rounded-md px-2.5 py-1.5 text-sm font-mono text-text-primary text-right focus:outline-none focus:border-accent/40 transition-colors"
    />
  );
}
