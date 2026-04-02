import type { AppSettings } from '@shared/config/Settings.config';
import { SettingsSectionRenderer } from '../SettingsSectionRenderer';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function ConsoleSection({ draft, set }: Props) {
  return <SettingsSectionRenderer section="console" draft={draft} set={set} />;
}
