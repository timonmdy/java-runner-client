import { VscClearAll, VscFolderOpened, VscSearch } from 'react-icons/vsc';
import { useTranslation } from '../../i18n/I18nProvider';
import { StatusDot } from '../common/display';
import { Button } from '../common/inputs';

interface Props {
  running: boolean;
  starting: boolean;
  pid: number | undefined;
  color: string;
  lineCount: number;
  autoScroll: boolean;
  searchOpen: boolean;
  onToggle: () => void;
  onForceStop: () => void;
  onOpenWorkDir: () => void;
  onScrollToBottom: () => void;
  onOpenSearch: () => void;
  onClear: () => void;
}

export function ConsoleToolbar({
  running,
  starting,
  pid,
  color,
  lineCount,
  autoScroll,
  searchOpen,
  onToggle,
  onForceStop,
  onOpenWorkDir,
  onScrollToBottom,
  onOpenSearch,
  onClear,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-base-900 shrink-0">
      <Button
        variant={running ? 'danger' : 'custom'}
        size="sm"
        onClick={onToggle}
        loading={starting}
        style={!running ? { backgroundColor: color, color: '#08090d', borderColor: color } : {}}
      >
        {running ? t('console.stop') : t('console.run')}
      </Button>

      {running && (
        <Button variant="ghost" size="sm" onClick={onForceStop} title={t('console.forceKillHint')}>
          {t('console.forceKill')}
        </Button>
      )}

      {running && pid && (
        <span className="flex items-center gap-1.5 text-xs font-mono text-text-muted animate-fade-in">
          <StatusDot color={color} pulse />
          PID <span className="text-text-secondary">{pid}</span>
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onOpenWorkDir}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        title={t('console.openWorkDir')}
      >
        <VscFolderOpened size={13} />
      </button>

      {!autoScroll && !searchOpen && (
        <button
          onClick={onScrollToBottom}
          className="text-xs font-mono transition-colors"
          style={{ color }}
        >
          {t('console.scrollToBottom')}
        </button>
      )}

      <button
        onClick={onOpenSearch}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        title={t('console.search')}
      >
        <VscSearch size={13} />
      </button>

      <button
        onClick={onClear}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
        title={t('console.clear')}
      >
        <VscClearAll size={13} />
      </button>

      <span className="text-xs text-text-muted font-mono tabular-nums ml-1">
        {lineCount.toLocaleString()} {t('console.lines')}
      </span>
    </div>
  );
}
