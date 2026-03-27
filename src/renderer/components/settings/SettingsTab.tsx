import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/Button';
import { SidebarLayout } from '../layout/SidebarLayout';
import { SETTINGS_TOPICS } from '../../../main/shared/config/Settings.config';
import { GeneralSection } from './sections/GeneralSection';
import { ConsoleSection } from './sections/ConsoleSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { AdvancedSection } from './sections/AdvancedSection';
import { UpdatesSection } from './sections/UpdatesSection';
import { AboutSection } from './sections/AboutSection';
import { AppSettings } from '../../../main/shared/types/App.types';

type SetFn = (patch: Partial<AppSettings>) => void;

export function SettingsTab() {
  const { state, saveSettings } = useApp();
  const { t } = useTranslation();
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

  const isStandaloneSection =
    activeTopic === 'appearance' || activeTopic === 'updates' || activeTopic === 'about';

  return (
    <div className="flex flex-col h-full min-h-0">
      {(isDirty || saved) && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
          <span className="text-xs text-text-secondary flex-1">
            {saved ? t('settings.saved') : t('settings.unsaved')}
          </span>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty}>
            {saved ? t('general.saved') : t('settings.saveChanges')}
          </Button>
        </div>
      )}

      <SidebarLayout
        topics={SETTINGS_TOPICS}
        activeTopicId={activeTopic}
        onTopicChange={setActiveTopic}
      >
        <div className="px-5 py-5 max-w-2xl space-y-6">
          {activeTopic === 'general' && <GeneralSection draft={draft} set={set} />}
          {activeTopic === 'console' && <ConsoleSection draft={draft} set={set} />}
          {activeTopic === 'appearance' && <AppearanceSection />}
          {activeTopic === 'advanced' && <AdvancedSection draft={draft} set={set} />}
          {activeTopic === 'updates' && <UpdatesSection />}
          {activeTopic === 'about' && <AboutSection />}
        </div>
      </SidebarLayout>
    </div>
  );
}
