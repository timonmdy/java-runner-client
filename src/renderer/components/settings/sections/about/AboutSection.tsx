import { VscFolderOpened } from 'react-icons/vsc';
import { version } from '../../../../../../package.json';
import { useTranslation } from '../../../../i18n/I18nProvider';
import { Tooltip } from '../../../common/Tooltip';
import { Row, Section } from '../../SettingsRow';
import { VersionChecker } from './VersionChecker';

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <Section title={t('settings.about')}>
      <VersionChecker currentVersion={version} />
      <Row label={t('settings.stack')}>
        <span className="font-mono text-xs text-text-secondary">Electron · React · TypeScript</span>
      </Row>
      <Row label={t('settings.configPath')}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-muted">%APPDATA%\java-runner-client</span>
          <Tooltip content={t('settings.openConfigFolder')} side="left" delay={300}>
            <button
              onClick={() => window.api.openConfigFolder()}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <VscFolderOpened size={14} />
            </button>
          </Tooltip>
        </div>
      </Row>
    </Section>
  );
}
