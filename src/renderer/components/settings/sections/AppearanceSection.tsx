import React, { useState, useEffect } from 'react';
import { Section } from '../SettingsRow';
import { useTheme } from '../../../hooks/ThemeProvider';
import { useTranslation } from '../../../i18n/I18nProvider';
import { VscSync, VscCheck } from 'react-icons/vsc';
import type { ThemeDefinition } from '../../../../main/shared/types/Theme.types';
import type { LanguageDefinition } from '../../../../main/shared/types/Language.types';
import type { JRCEnvironment } from '../../../../main/shared/types/App.types';

type FetchState = 'idle' | 'loading' | 'done' | 'error';

export function AppearanceSection() {
  const { theme, setTheme, availableThemes, refreshThemes } = useTheme();
  const { language, setLanguage, availableLanguages, refreshLanguages } = useTranslation();

  const [remoteThemes, setRemoteThemes] = useState<ThemeDefinition[]>([]);
  const [remoteLangs, setRemoteLangs] = useState<LanguageDefinition[]>([]);
  const [themeFetch, setThemeFetch] = useState<FetchState>('idle');
  const [langFetch, setLangFetch] = useState<FetchState>('idle');
  const [isDev, setIsDev] = useState(false);
  const [devSynced, setDevSynced] = useState(false);

  useEffect(() => {
    window.env.get().then((env: JRCEnvironment) => setIsDev(env.type === 'dev'));
  }, []);

  const fetchThemes = async () => {
    setThemeFetch('loading');
    const res = await window.api.fetchRemoteThemes();
    if (res.ok && res.themes) { setRemoteThemes(res.themes); setThemeFetch('done'); }
    else setThemeFetch('error');
  };

  const fetchLangs = async () => {
    setLangFetch('loading');
    const res = await window.api.fetchRemoteLanguages();
    if (res.ok && res.languages) { setRemoteLangs(res.languages); setLangFetch('done'); }
    else setLangFetch('error');
  };

  const selectTheme = async (t: ThemeDefinition) => {
    await window.api.installTheme(t);
    await window.api.setActiveTheme(t.id);
    await refreshThemes();
  };

  const selectLang = async (l: LanguageDefinition) => {
    await window.api.installLanguage(l);
    await window.api.setActiveLanguage(l.id);
    await refreshLanguages();
  };

  const handleDevSync = async () => {
    await window.api.syncLocalDevAssets();
    await refreshThemes();
    await refreshLanguages();
    setDevSynced(true);
    setTimeout(() => setDevSynced(false), 2000);
  };

  const allThemes = mergeById(availableThemes, remoteThemes, (t) => t.id);
  const allLangs = mergeById(availableLanguages, remoteLangs, (l) => l.id);

  return (
    <>
      <Section title="Theme">
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">Select a visual theme</p>
          <button
            onClick={fetchThemes}
            disabled={themeFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={themeFetch === 'loading' ? 'animate-spin' : ''} />
            {themeFetch === 'done' ? 'Refresh' : 'Load from GitHub'}
          </button>
        </div>
        {themeFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">Failed to fetch themes.</p>
        )}
        <div className="space-y-1 py-1">
          {allThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => theme.id === t.id ? undefined : selectTheme(t)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                theme.id === t.id ? 'bg-surface-raised' : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <div className="flex gap-1 shrink-0">
                {(['accent', 'base-900', 'surface-raised', 'text-primary'] as const).map((key) => (
                  <span
                    key={key}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.colors[key] }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-primary flex-1">{t.name}</span>
              {theme.id === t.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Language">
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">Select a display language</p>
          <button
            onClick={fetchLangs}
            disabled={langFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={langFetch === 'loading' ? 'animate-spin' : ''} />
            {langFetch === 'done' ? 'Refresh' : 'Load from GitHub'}
          </button>
        </div>
        {langFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">Failed to fetch languages.</p>
        )}
        <div className="space-y-1 py-1">
          {allLangs.map((l) => (
            <button
              key={l.id}
              onClick={() => language.id === l.id ? undefined : selectLang(l)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                language.id === l.id ? 'bg-surface-raised' : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <span className="text-xs text-text-primary flex-1">{l.name}</span>
              {language.id === l.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      {isDev && (
        <Section title="Development">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs text-text-primary">Sync local project files</p>
              <p className="text-xs text-text-muted mt-0.5">
                Load themes and languages from /themes and /languages in the project root
              </p>
            </div>
            <button
              onClick={handleDevSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
            >
              {devSynced ? <VscCheck size={11} className="text-accent" /> : <VscSync size={11} />}
              {devSynced ? 'Synced' : 'Sync'}
            </button>
          </div>
        </Section>
      )}
    </>
  );
}

/** Merge local + remote lists by ID, preferring remote version if newer */
function mergeById<T>(local: T[], remote: T[], getId: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(getId(item), item);
  for (const item of remote) map.set(getId(item), item);
  return Array.from(map.values());
}
