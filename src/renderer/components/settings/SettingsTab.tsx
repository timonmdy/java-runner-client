import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../AppProvider';
import { Button } from '../common/Button';
import { SidebarLayout } from '../layout/SidebarLayout';
import { SETTINGS_TOPICS } from '../../../main/shared/config/Settings.config';
import { StartupSection } from './sections/StartupSection';
import { ConsoleSection } from './sections/ConsoleSection';
import { DeveloperSection } from './sections/DeveloperSection';
import { AboutSection } from './sections/AboutSection';
import { AppSettings } from '../../../main/shared/types/App.types';

const SECTION_COMPONENTS: Record<string, React.FC<{ draft: AppSettings; set: SetFn }> | React.FC> =
  {
    startup: StartupSection,
    console: ConsoleSection,
    developer: DeveloperSection,
    about: AboutSection,
  };

type SetFn = (patch: Partial<AppSettings>) => void;

export function SettingsTab() {
  const { state, saveSettings } = useApp();
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTopic, setActiveTopic] = useState(SETTINGS_TOPICS[0].id);
  const initializedRef = useRef(false);

  const set: SetFn = (patch) => {
    setSaved(false);
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    if (!state.settings) return;
    if (!initializedRef.current) {
      setDraft(state.settings);
      initializedRef.current = true;
      return;
    }
    setDraft((prev) => {
      if (!prev) return state.settings;
      if (prev.devModeEnabled === state.settings!.devModeEnabled) return prev;
      return { ...prev, devModeEnabled: state.settings!.devModeEnabled };
    });
  }, [state.settings]);

  useEffect(() => {
    const unsub = window.env.onChange((env) => {
      setDraft((prev) => {
        if (!prev || prev.devModeEnabled === env.devMode) return prev;
        return { ...prev, devModeEnabled: env.devMode };
      });
    });
    return unsub;
  }, []);

  const isDirty = useMemo(() => {
    if (!draft || !state.settings) return false;
    return JSON.stringify(draft) !== JSON.stringify(state.settings);
  }, [draft, state.settings]);

  if (!draft) return null;

  const handleSave = async () => {
    await saveSettings(draft);
    window.env.reload();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ActiveSection = SECTION_COMPONENTS[activeTopic];

  return (
    <div className="flex flex-col h-full min-h-0">
      {(isDirty || saved) && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
          <span className="text-xs text-text-secondary flex-1">
            {saved ? 'Settings saved' : 'Unsaved changes'}
          </span>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty}>
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      )}

      <SidebarLayout
        topics={SETTINGS_TOPICS}
        activeTopicId={activeTopic}
        onTopicChange={setActiveTopic}
      >
        <div className="px-5 py-5 max-w-2xl">
          {ActiveSection && (
            <ActiveSection draft={draft} set={set} />
          )}
        </div>
      </SidebarLayout>
    </div>
  );
}
