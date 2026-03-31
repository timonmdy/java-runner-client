interface DataRowProps {
  label: string;
  value: string;
  /** Use monospace font for the value */
  mono?: boolean;
  /** Allow value to wrap instead of truncate */
  wrap?: boolean;
  /** Width of the label column (tailwind class, e.g. "w-28") */
  labelWidth?: string;
}

export function DataRow({ label, value, mono, wrap, labelWidth }: DataRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span
        className={['text-xs text-text-muted font-mono shrink-0', labelWidth ?? '']
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </span>
      <span
        className={[
          'text-xs text-text-secondary flex-1',
          mono ? 'font-mono' : '',
          wrap ? 'break-all' : 'truncate text-right',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
