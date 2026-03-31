import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n/I18nProvider';

interface Props {
  title: string;
  backTo?: string;
}

export function PanelHeader({ title, backTo = '/console' }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-b border-surface-border bg-base-900">
      <div className="flex items-center gap-3 px-4 h-10">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M8 2L4 6l4 4" />
          </svg>
          {t('general.back')}
        </button>
        <div className="w-px h-4 bg-surface-border" />
        <span className="text-xs font-medium text-text-secondary">{title}</span>
      </div>
    </div>
  );
}
