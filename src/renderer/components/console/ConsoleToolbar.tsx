import { VscSearch } from 'react-icons/vsc';
import { Button } from '../common/Button';

interface Props {
  running: boolean;
  starting: boolean;
  pid?: number;
  color: string;
  lineCount: number;
  autoScroll: boolean;
  onToggle: () => void;
  onClear: () => void;
  onOpenSearch: () => void;
  onScrollToBottom: () => void;
}

export function ConsoleToolbar({
  running,
  starting,
  pid,
  color,
  lineCount,
  autoScroll,
  onToggle,
  onClear,
  onOpenSearch,
  onScrollToBottom,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-base-900 shrink-0">
      <Button
        variant={running ? 'danger' : 'primary'}
        size="sm"
        onClick={onToggle}
        loading={starting}
        style={!running ? { backgroundColor: color, color: '#08090d', borderColor: color } : {}}
      >
        {running ? 'Stop' : 'Run'}
      </Button>

      {running && pid && (
        <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted animate-fade-in">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
            style={{ backgroundColor: color }}
          />
          PID <span className="text-text-secondary">{pid}</span>
        </span>
      )}

      <div className="flex-1" />

      {!autoScroll && (
        <button
          onClick={onScrollToBottom}
          className="text-xs font-mono transition-colors"
          style={{ color }}
        >
          scroll to bottom
        </button>
      )}

      <button
        onClick={onOpenSearch}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        title="Search (Ctrl+F)"
      >
        <VscSearch size={13} />
      </button>

      <button
        onClick={onClear}
        className="text-xs text-text-muted hover:text-text-primary font-mono transition-colors"
        title="Clear (Ctrl+L)"
      >
        Clear
      </button>

      <span className="text-xs text-text-muted font-mono tabular-nums">
        {lineCount.toLocaleString()} lines
      </span>
    </div>
  );
}
