interface Props {
  color?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2' };

export function StatusDot({ color, pulse, size = 'sm', className }: Props) {
  return (
    <span
      className={[
        'inline-block rounded-full shrink-0',
        SIZES[size],
        pulse ? 'animate-pulse-dot' : '',
        color ? '' : 'bg-accent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
