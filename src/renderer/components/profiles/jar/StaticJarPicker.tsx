import React from 'react';
import { Input } from '../../common/Input';
import { FolderBtn } from './FolderBtn';
import { useTranslation } from '../../../i18n/I18nProvider';

interface Props {
  jarPath: string;
  onChange: (path: string) => void;
  onPick: () => void;
}

export function StaticJarPicker({ jarPath, onChange, onPick }: Props) {
  const { t } = useTranslation();

  return (
    <Input
      label={t('config.jarFile')}
      value={jarPath}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('config.jarFilePlaceholder')}
      hint={t('config.jarFileHint')}
      rightElement={<FolderBtn onClick={onPick} />}
    />
  );
}
