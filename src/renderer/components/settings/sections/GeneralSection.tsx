import { AppSettings } from '@shared/types/App.types';
import { useTranslation } from '../../../i18n/I18nProvider';
import { Toggle } from '../../common/inputs';
import { Row, Section } from '../SettingsRow';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function GeneralSection({ draft, set }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Section title={t('settings.startup')} divided>
        <Row label={t('settings.launchOnStartup')} hint={t('settings.launchOnStartupHint')}>
          <Toggle checked={draft.launchOnStartup} onChange={(v) => set({ launchOnStartup: v })} />
        </Row>
        <Row label={t('settings.startMinimized')} hint={t('settings.startMinimizedHint')} sub>
          <Toggle
            checked={draft.startMinimized}
            onChange={(v) => set({ startMinimized: v })}
            disabled={!draft.launchOnStartup}
          />
        </Row>
        <Row label={t('settings.minimizeToTray')} hint={t('settings.minimizeToTrayHint')}>
          <Toggle checked={draft.minimizeToTray} onChange={(v) => set({ minimizeToTray: v })} />
        </Row>
      </Section>
    </>
  );
}
