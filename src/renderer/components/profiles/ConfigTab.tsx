import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { Button } from '../common/Button';
import { ArgList } from '../common/ArgList';
import { PropList } from '../common/PropList';
import { Dialog } from '../common/Dialog';
import { GeneralSection } from './GeneralSection';
import { FilesSection } from './FilesSection';
import { Profile } from '../../../main/shared/types/Profile.types';

type Section = 'general' | 'files' | 'jvm' | 'props' | 'args';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'files', label: 'Files & Paths' },
  { id: 'jvm', label: 'JVM Args' },
  { id: 'props', label: 'Properties (-D)' },
  { id: 'args', label: 'Program Args' },
];

function buildCmdPreview(p: Profile): string {
  const parts: string[] = [p.javaPath || 'java'];
  p.jvmArgs.filter((a) => a.enabled && a.value).forEach((a) => parts.push(a.value));
  p.systemProperties
    .filter((a) => a.enabled && a.key)
    .forEach((a) => parts.push(a.value ? `-D${a.key}=${a.value}` : `-D${a.key}`));
  parts.push('-jar', p.jarPath || '<no jar>');
  p.programArgs.filter((a) => a.enabled && a.value).forEach((a) => parts.push(a.value));
  return parts.join(' ');
}

export function ConfigTab() {
  const { activeProfile, saveProfile, isRunning, startProcess, stopProcess } = useApp();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<Section>('general');
  const [pendingArg, setPendingArg] = useState(false);
  const [pendingChange, setPendingChange] = useState<Section | null>(null);

  useEffect(() => {
    if (activeProfile) {
      setDraft({ ...activeProfile });
      setSaved(false);
      setPendingArg(false);
    }
  }, [activeProfile?.id]);

  const isDirty = useMemo(() => {
    if (!draft || !activeProfile) return false;
    return JSON.stringify(draft) !== JSON.stringify(activeProfile);
  }, [draft, activeProfile]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await saveProfile(draft);
    activeProfile && Object.assign(activeProfile, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [draft, saveProfile, activeProfile]);

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
        No profile selected
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
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
          <h2 className="text-sm font-medium text-text-primary flex-1 truncate">{draft.name}</h2>
          {isDirty && !saved && (
            <span className="text-xs text-console-warn font-mono">unsaved changes</span>
          )}
          {running && isDirty && (
            <span className="text-xs text-text-muted font-mono">· restart needed</span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            style={{ backgroundColor: color, color: '#08090d', borderColor: color }}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Section tabs */}
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

        {/* Section content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-5">
          {section === 'general' && (
            <GeneralSection
              draft={draft}
              update={update}
              running={running}
              onRestart={handleRestart}
            />
          )}
          {section === 'files' && <FilesSection draft={draft} update={update} />}
          {section === 'jvm' && (
            <ArgSection
              title="JVM Arguments"
              hint="Flags passed to the JVM before -jar, e.g. -Xmx2g -XX:+UseG1GC"
            >
              <ArgList
                items={draft.jvmArgs}
                onChange={(jvmArgs) => update({ jvmArgs })}
                onPendingChange={setPendingArg}
                placeholder="-Xmx2g"
              />
            </ArgSection>
          )}
          {section === 'props' && (
            <ArgSection
              title="System Properties"
              hint="Passed as -Dkey=value. Spring profiles, ports, logging levels, etc."
            >
              <PropList
                items={draft.systemProperties}
                onChange={(systemProperties) => update({ systemProperties })}
                onPendingChange={setPendingArg}
              />
            </ArgSection>
          )}
          {section === 'args' && (
            <ArgSection
              title="Program Arguments"
              hint="Appended after the JAR path, e.g. --nogui --world myWorld"
            >
              <ArgList
                items={draft.programArgs}
                onChange={(programArgs) => update({ programArgs })}
                onPendingChange={setPendingArg}
                placeholder="--nogui"
              />
            </ArgSection>
          )}

          {/* Command preview */}
          <div className="rounded-lg bg-base-950 border border-surface-border p-3">
            <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">
              Command preview
            </p>
            <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
              {buildCmdPreview(draft)}
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={pendingChange !== null}
        title="Unsaved argument input"
        message={
          'You have text in the argument input that hasn\'t been added yet.\n\nClick "+ Add" first, otherwise it will not take effect.\n\nSwitch anyway?'
        }
        confirmLabel="Switch"
        cancelLabel="Stay"
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
