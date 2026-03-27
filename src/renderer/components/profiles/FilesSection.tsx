import React from 'react';
import { Input } from '../common/Input';
import { Profile } from '../../../main/shared/types/Profile.types';
import { useTranslation } from '../../i18n/I18nProvider';
import { JarSelector } from './jar/JarSelector';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';

interface Props {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}

export function FilesSection({
  draft,
  update,
}: {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}) {
  const { t } = useTranslation();
  const { onContextMenu, contextMenu } = useInputContextMenu();

  const handlePickJar = async () => {
    const p = await window.api.pickJar();
    if (p) update({ jarPath: p });
  };
  const handlePickDir = async () => {
    const p = await window.api.pickDir();
    if (p) update({ workingDir: p });
  };
  const handlePickResolutionDir = async () => {
    const p = await window.api.pickDir();
    if (p)
      update({
        jarResolution: {
          ...(draft.jarResolution ?? {
            enabled: true,
            pattern: 'app-{version}.jar',
            strategy: 'highest-version',
            regexOverride: '',
          }),
          baseDir: p,
        },
      });
  };
  const handlePickJava = async () => {
    const p = await window.api.pickJava();
    if (p) update({ javaPath: p });
  };

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-xl border border-surface-border bg-base-900/40 p-4 space-y-3">
          <h4 className="text-xs font-mono text-text-muted uppercase tracking-widest">
            {t('config.jarSelection')}
          </h4>
          <JarSelector
            jarPath={draft.jarPath}
            resolution={draft.jarResolution}
            onJarPathChange={(jarPath) => update({ jarPath })}
            onResolutionChange={(jarResolution) => update({ jarResolution })}
            onPickJar={handlePickJar}
            onPickDir={handlePickResolutionDir}
          />
        </div>
        <Input
          label={t('config.workDir')}
          value={draft.workingDir}
          onChange={(e) => update({ workingDir: e.target.value })}
          onContextMenu={onContextMenu}
          placeholder={t('config.workDirPlaceholder')}
          hint={t('config.workDirHint')}
          rightElement={<FolderBtn onClick={handlePickDir} />}
        />
        <Input
          label={t('config.javaExe')}
          value={draft.javaPath}
          onChange={(e) => update({ javaPath: e.target.value })}
          onContextMenu={onContextMenu}
          placeholder={t('config.javaExePlaceholder')}
          hint={t('config.javaExeHint')}
          rightElement={<FolderBtn onClick={handlePickJava} />}
        />
      </div>
      {contextMenu}
    </>
  );
}

function FolderBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-text-muted hover:text-accent transition-colors">
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1 3.5h4l1.5 2H13v7H1V3.5z" />
      </svg>
    </button>
  );
}
