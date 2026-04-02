import { SETTINGS_TOPICS } from '@shared/config/Settings.config';
import { AppSettings } from '@shared/config/Settings.config';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/TranslationKeys';
import { Button } from '../common/inputs';
import { SidebarLayout } from '../layout/navigation';
import { AdvancedSection } from './sections/AdvancedSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { ConsoleSection } from './sections/ConsoleSection';
import { GeneralSection } from './sections/GeneralSection';
import { AboutSection } from './sections/about/AboutSection';

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

  const translatedTopics = useMemo(
    () =>
      SETTINGS_TOPICS.map((topic) => ({
        ...topic,
        label: t(`settings.${topic.id}` as TranslationKey),
      })),
    [t]
  );

  if (!draft) return null;

  const handleSave = async () => {
    await saveSettings(draft);
    window.env.reload();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        topics={translatedTopics}
        activeTopicId={activeTopic}
        onTopicChange={setActiveTopic}
      >
        <div className="px-5 py-5 max-w-2xl space-y-6">
          {activeTopic === 'general' && <GeneralSection draft={draft} set={set} />}
          {activeTopic === 'console' && <ConsoleSection draft={draft} set={set} />}
          {activeTopic === 'appearance' && <AppearanceSection />}
          {activeTopic === 'advanced' && <AdvancedSection draft={draft} set={set} />}
          {activeTopic === 'about' && <AboutSection />}
        </div>
      </SidebarLayout>
    </div>
  );
}
