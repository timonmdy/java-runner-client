import React from 'react';
import { useTranslation } from '../../../i18n/I18nProvider';
import { Section, Row } from '../SettingsRow';
import { VersionChecker } from '../VersionChecker';
import { version } from '../../../../../package.json';

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <Section title={t('settings.about')}>
      <VersionChecker currentVersion={version} />
      <Row label={t('settings.stack')}>
        <span className="font-mono text-xs text-text-secondary">Electron · React · TypeScript</span>
      </Row>
      <Row label={t('settings.configPath')}>
        <span className="font-mono text-xs text-text-muted">%APPDATA%\java-runner-client</span>
      </Row>
    </Section>
  );
}
