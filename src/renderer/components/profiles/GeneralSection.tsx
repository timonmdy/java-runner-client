import { Profile } from '@shared/types/Profile.types';
import { useTranslation } from '../../i18n/I18nProvider';
import { Toggle } from '../common/Toggle';

export function GeneralSection({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">
          {t('config.autoStartTitle')}
        </h3>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
          <div>
            <p className="text-xs text-text-primary font-medium">{t('config.autoStart')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('config.autoStartHint')}</p>
          </div>
          <Toggle checked={draft.autoStart} onChange={(v) => update({ autoStart: v })} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">
          {t('config.autoRestartTitle')}
        </h3>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
          <div>
            <p className="text-xs text-text-primary font-medium">{t('config.autoRestart')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('config.autoRestartHint')}</p>
          </div>
          <Toggle
            checked={draft.autoRestart ?? false}
            onChange={(v) => update({ autoRestart: v })}
          />
        </div>

        {draft.autoRestart && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
            <div>
              <p className="text-xs text-text-primary font-medium">
                {t('config.autoRestartInterval')}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {t('config.autoRestartIntervalHint')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={3600}
                value={draft.autoRestartInterval ?? 10}
                onChange={(e) =>
                  update({ autoRestartInterval: Math.max(1, parseInt(e.target.value) || 10) })
                }
                className="w-20 bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary text-right focus:outline-none focus:border-accent/40"
              />
              <span className="text-xs text-text-muted font-mono">{t('config.sec')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">
          {t('config.logging')}
        </h3>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-base-900 border border-surface-border px-3 py-2.5">
          <div>
            <p className="text-xs text-text-primary font-medium">{t('config.fileLogging')}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('config.fileLoggingHint')}</p>
          </div>
          <Toggle
            checked={draft.fileLogging ?? false}
            onChange={(v) => update({ fileLogging: v })}
          />
        </div>
      </div>
    </div>
  );
}
