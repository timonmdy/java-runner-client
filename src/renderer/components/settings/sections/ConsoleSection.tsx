import { AppSettings } from '@shared/types/App.types';
import { useTranslation } from '../../../i18n/I18nProvider';
import { Toggle } from '../../common/inputs';
import { NumInput, Row, Section } from '../SettingsRow';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function ConsoleSection({ draft, set }: Props) {
  const { t } = useTranslation();

  return (
    <Section title={t('settings.console')} divided>
      <Row label={t('settings.fontSize')} hint={t('settings.fontSizeHint')}>
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min={10}
            max={20}
            value={draft.consoleFontSize}
            onChange={(e) => set({ consoleFontSize: Number(e.target.value) })}
            className="w-24 accent-accent cursor-pointer"
          />
          <span className="text-sm font-mono text-text-secondary w-10 text-right tabular-nums">
            {draft.consoleFontSize}px
          </span>
        </div>
      </Row>
      <Row label={t('settings.lineNumbers')} hint={t('settings.lineNumbersHint')}>
        <Toggle
          checked={draft.consoleLineNumbers}
          onChange={(v) => set({ consoleLineNumbers: v })}
        />
      </Row>
      <Row label={t('settings.timestamps')} hint={t('settings.timestampsHint')}>
        <Toggle checked={draft.consoleTimestamps} onChange={(v) => set({ consoleTimestamps: v })} />
      </Row>
      <Row label={t('settings.wordWrap')} hint={t('settings.wordWrapHint')}>
        <Toggle checked={draft.consoleWordWrap} onChange={(v) => set({ consoleWordWrap: v })} />
      </Row>
      <Row label={t('settings.maxLines')} hint={t('settings.maxLinesHint')}>
        <NumInput
          value={draft.consoleMaxLines}
          min={500}
          max={50000}
          step={500}
          onChange={(v) => set({ consoleMaxLines: v })}
        />
      </Row>
      <Row label={t('settings.historySize')} hint={t('settings.historySizeHint')}>
        <NumInput
          value={draft.consoleHistorySize}
          min={10}
          max={2000}
          step={10}
          onChange={(v) => set({ consoleHistorySize: v })}
        />
      </Row>
    </Section>
  );
}
