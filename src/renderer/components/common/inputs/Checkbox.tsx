interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, disabled }: Props) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'w-4 h-4 rounded border transition-colors shrink-0',
        checked
          ? 'bg-accent border-accent'
          : 'bg-transparent border-surface-border hover:border-text-muted',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {checked && (
        <svg
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-full h-full text-base-950 p-0.5"
        >
          <polyline points="2,5 4,7.5 8,2.5" />
        </svg>
      )}
    </button>
  );
}
