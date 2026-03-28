import { Profile } from '@shared/types/Profile.types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { ArgList } from '../common/ArgList';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { EnvVarList } from '../common/EnvVarList';
import { PropList } from '../common/PropList';
import { FilesSection } from './FilesSection';
import { GeneralSection } from './GeneralSection';

type Section = 'general' | 'files' | 'jvm' | 'props' | 'args' | 'env';

export function ConfigTab() {
  const { activeProfile, saveProfile, isRunning, startProcess, stopProcess } = useApp();
  const { t } = useTranslation();

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'general', label: t('config.general') },
    { id: 'files', label: t('config.files') },
    { id: 'jvm', label: t('config.jvm') },
    { id: 'props', label: t('config.props') },
    { id: 'args', label: t('config.args') },
    { id: 'env', label: t('config.env') },
  ];

  const [draft, setDraft] = useState<Profile | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<Section>('general');
  const [pendingArg, setPendingArg] = useState(false);
  const [pendingChange, setPendingChange] = useState<Section | null>(null);

  useEffect(() => {
    if (activeProfile) {
      setDraft({ ...activeProfile, envVars: activeProfile.envVars ?? [] });
      setSavedSnapshot({ ...activeProfile, envVars: activeProfile.envVars ?? [] });
      setSaved(false);
      setPendingArg(false);
    }
  }, [activeProfile?.id]);

  const isDirty = useMemo(() => {
    if (!draft || !savedSnapshot) return false;
    return JSON.stringify(draft) !== JSON.stringify(savedSnapshot);
  }, [draft, savedSnapshot]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await saveProfile(draft);
    setSavedSnapshot({ ...draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [draft, saveProfile]);

  const requestSectionChange = useCallback(
    (next: Section) => {
      if (pendingArg && next !== section) {
        setPendingChange(next);
        return;
      }
      setPendingArg(false);
      setSection(next);
    },
    [pendingArg, section]
  );

  const handleRestart = useCallback(async () => {
    if (!draft) return;
    await stopProcess(draft.id);
    setTimeout(() => startProcess(draft), 800);
  }, [draft, stopProcess, startProcess]);

  if (!draft || !activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        {t('general.noProfileSelected')}
      </div>
    );
  }

  const running = isRunning(draft.id);
  const color = draft.color || '#4ade80';
  const update = (patch: Partial<Profile>) => {
    setSaved(false);
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
          <h2 className="text-sm font-medium text-text-primary flex-1 truncate">{draft.name}</h2>
          {isDirty && !saved && (
            <span className="text-xs text-console-warn font-mono">
              {t('config.unsavedChanges')}
            </span>
          )}
          {running && isDirty && (
            <span className="text-xs text-text-muted font-mono">· {t('config.restartNeeded')}</span>
          )}
          <Button
            variant="custom"
            size="sm"
            onClick={handleSave}
            style={{ backgroundColor: color, color: '#08090d', borderColor: color }}
          >
            {saved ? t('general.saved') : t('general.save')}
          </Button>
        </div>

        <div className="flex gap-0 px-4 border-b border-surface-border shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => requestSectionChange(s.id)}
              className={[
                'px-3 py-2 text-xs font-mono border-b-2 -mb-px transition-colors',
                section === s.id
                  ? 'font-medium'
                  : 'text-text-muted border-transparent hover:text-text-primary',
              ].join(' ')}
              style={section === s.id ? { borderBottomColor: color, color } : {}}
            >
              {s.label}
              {pendingArg && s.id === section && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-console-warn align-middle" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {section === 'general' && <GeneralSection draft={draft} update={update} />}
          {section === 'files' && <FilesSection draft={draft} update={update} />}
          {section === 'jvm' && (
            <ArgSection title={t('config.jvmTitle')} hint={t('config.jvmHint')}>
              <ArgList
                items={draft.jvmArgs}
                onChange={(jvmArgs) => update({ jvmArgs })}
                onPendingChange={setPendingArg}
                placeholder="-Xmx2g"
              />
            </ArgSection>
          )}
          {section === 'props' && (
            <ArgSection title={t('config.propsTitle')} hint={t('config.propsHint')}>
              <PropList
                items={draft.systemProperties}
                onChange={(systemProperties) => update({ systemProperties })}
                onPendingChange={setPendingArg}
              />
            </ArgSection>
          )}
          {section === 'args' && (
            <ArgSection title={t('config.argsTitle')} hint={t('config.argsHint')}>
              <ArgList
                items={draft.programArgs}
                onChange={(programArgs) => update({ programArgs })}
                onPendingChange={setPendingArg}
                placeholder="--nogui"
              />
            </ArgSection>
          )}
          {section === 'env' && (
            <ArgSection title={t('config.envTitle')} hint={t('config.envHint')}>
              <EnvVarList
                items={draft.envVars ?? []}
                onChange={(envVars) => update({ envVars })}
                onPendingChange={setPendingArg}
              />
            </ArgSection>
          )}

          <div className="rounded-lg bg-base-950 border border-surface-border p-3">
            <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">
              {t('config.commandPreview')}
            </p>
            <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
              {buildCmdPreview(draft)}
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={pendingChange !== null}
        title={t('config.pendingArgTitle')}
        message={t('config.pendingArgMessage')}
        confirmLabel={t('config.pendingArgConfirm')}
        cancelLabel={t('config.pendingArgCancel')}
        onConfirm={() => {
          if (pendingChange) {
            setPendingArg(false);
            setSection(pendingChange);
          }
          setPendingChange(null);
        }}
        onCancel={() => setPendingChange(null)}
      />
    </>
  );
}

function ArgSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function buildCmdPreview(p: Profile): string {
  const isDynamic = p.jarResolution?.enabled;
  const jarDisplay = isDynamic
    ? `<dynamic: ${p.jarResolution?.strategy ?? 'highest-version'}>`
    : p.jarPath || '<no jar>';

  const parts: string[] = [p.javaPath || 'java'];
  p.jvmArgs.filter((a) => a.enabled && a.value).forEach((a) => parts.push(a.value));
  p.systemProperties
    .filter((a) => a.enabled && a.key)
    .forEach((a) => parts.push(a.value ? `-D${a.key}=${a.value}` : `-D${a.key}`));
  parts.push('-jar', jarDisplay);
  p.programArgs.filter((a) => a.enabled && a.value).forEach((a) => parts.push(a.value));
  return parts.join(' ');
}
