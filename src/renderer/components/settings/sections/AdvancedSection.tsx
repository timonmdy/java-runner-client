import React from 'react';
import { useTranslation } from '../../../i18n/I18nProvider';
import { Toggle } from '../../common/Toggle';
import { Section, Row, NumInput } from '../SettingsRow';
import { REST_API_CONFIG } from '../../../../main/shared/config/API.config';
import { AppSettings } from '../../../../main/shared/types/App.types';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function AdvancedSection({ draft, set }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('settings.devMode')}>
        <Row label={t('settings.devModeLabel')} hint={t('settings.devModeHint')}>
          <Toggle checked={draft.devModeEnabled} onChange={(v) => set({ devModeEnabled: v })} />
        </Row>
      </Section>

      <Section title={t('settings.restApi')}>
        <Row
          label={t('settings.restApiLabel')}
          hint={t('settings.restApiHint', { port: String(REST_API_CONFIG.defaultPort) })}
        >
          <Toggle checked={draft.restApiEnabled} onChange={(v) => set({ restApiEnabled: v })} />
        </Row>
        {draft.restApiEnabled && (
          <Row label={t('settings.restApiPort')} hint={t('settings.restApiPortHint')} sub>
            <NumInput
              value={draft.restApiPort}
              min={1024}
              max={65535}
              step={1}
              onChange={(v) => set({ restApiPort: v })}
            />
          </Row>
        )}
        {draft.restApiEnabled && (
          <div className="rounded-lg border border-surface-border bg-base-900/50 px-3 py-2.5 pl-5">
            <p className="text-xs text-text-muted font-mono">
              {t('settings.listeningOn')}{' '}
              <span className="text-accent">
                http://{REST_API_CONFIG.host}:{draft.restApiPort}/api
              </span>
            </p>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              {t('settings.endpoints')}: /status · /profiles · /processes · /logs · /settings
            </p>
          </div>
        )}
      </Section>
    </>
  );
}
