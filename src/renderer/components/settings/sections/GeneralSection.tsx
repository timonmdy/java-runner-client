import type { AppSettings } from '@shared/config/Settings.config';
import { SettingsSectionRenderer } from '../SettingsSectionRenderer';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function GeneralSection({ draft, set }: Props) {
  return <SettingsSectionRenderer section="general" draft={draft} set={set} />;
}
