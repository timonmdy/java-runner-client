import React, { useState, useEffect } from 'react';
import { Section } from '../SettingsRow';
import { useTheme } from '../../../hooks/ThemeProvider';
import { useTranslation } from '../../../i18n/I18nProvider';
import { VscSync, VscCheck } from 'react-icons/vsc';
import type { ThemeDefinition } from '../../../../main/shared/types/Theme.types';
import type { LanguageDefinition } from '../../../../main/shared/types/Language.types';
import { ENGLISH } from '../../../../main/shared/config/DefaultLanguage.config';
import type { JRCEnvironment } from '../../../../main/shared/types/App.types';

type FetchState = 'idle' | 'loading' | 'done' | 'error';

const THEME_SESSION_KEY = 'jrc:session-themes';
const LANG_SESSION_KEY = 'jrc:session-langs';

function readSession<T>(key: string): T[] {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function writeSession<T>(key: string, items: T[]): void {
  sessionStorage.setItem(key, JSON.stringify(items));
}

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { language, t, setLanguage } = useTranslation();

  const [sessionThemes, setSessionThemes] = useState<ThemeDefinition[]>(() =>
    readSession<ThemeDefinition>(THEME_SESSION_KEY)
  );
  const [sessionLangs, setSessionLangs] = useState<LanguageDefinition[]>(() =>
    readSession<LanguageDefinition>(LANG_SESSION_KEY)
  );
  const [themeFetch, setThemeFetch] = useState<FetchState>('idle');
  const [langFetch, setLangFetch] = useState<FetchState>('idle');
  const [isDev, setIsDev] = useState(false);
  const [devSynced, setDevSynced] = useState(false);

  useEffect(() => {
    window.env.get().then((env: JRCEnvironment) => setIsDev(env.type === 'dev'));
  }, []);

  const fetchThemes = async () => {
    sessionStorage.removeItem(THEME_SESSION_KEY);
    setSessionThemes([]);
    setThemeFetch('loading');
    const res = await window.api.fetchRemoteThemes();
    if (res.ok && res.themes) {
      writeSession(THEME_SESSION_KEY, res.themes);
      setSessionThemes(res.themes);
      setThemeFetch('done');
    } else {
      setThemeFetch('error');
    }
  };

  const fetchLangs = async () => {
    sessionStorage.removeItem(LANG_SESSION_KEY);
    setSessionLangs([]);
    setLangFetch('loading');
    const res = await window.api.fetchRemoteLanguages();
    if (res.ok && res.languages) {
      writeSession(LANG_SESSION_KEY, res.languages);
      setSessionLangs(res.languages);
      setLangFetch('done');
    } else {
      setLangFetch('error');
    }
  };

  const handleDevSync = async () => {
    const assets = await window.api.loadDevAssets();
    const newThemes = mergeById(sessionThemes, assets.themes, (th) => th.id);
    writeSession(THEME_SESSION_KEY, newThemes);
    setSessionThemes(newThemes);
    const newLangs = mergeById(sessionLangs, assets.languages, (l) => l.id);
    writeSession(LANG_SESSION_KEY, newLangs);
    setSessionLangs(newLangs);
    setDevSynced(true);
    setTimeout(() => setDevSynced(false), 2000);
  };

  // Active theme/lang always shown first; session entries fill the rest
  const allThemes = [theme, ...sessionThemes.filter((th) => th.id !== theme.id)];
  const allLangs = mergeById([language, ENGLISH], sessionLangs, (l) => l.id);

  return (
    <>
      <Section title={t('settings.theme')}>
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">{t('settings.themeHint')}</p>
          <button
            onClick={fetchThemes}
            disabled={themeFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={themeFetch === 'loading' ? 'animate-spin' : ''} />
            {themeFetch === 'idle' ? t('general.load') : t('general.refresh')}
          </button>
        </div>
        {themeFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">{t('appearance.fetchThemesFailed')}</p>
        )}
        <div className="space-y-1 py-1">
          {allThemes.map((th) => (
            <button
              key={th.id}
              onClick={() => (theme.id === th.id ? undefined : setTheme(th))}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                theme.id === th.id
                  ? 'bg-surface-raised'
                  : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <div className="flex gap-1 shrink-0">
                {(['accent', 'base-900', 'surface-raised', 'text-primary'] as const).map((key) => (
                  <span
                    key={key}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: th.colors[key] }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-primary flex-1">{th.name}</span>
              {theme.id === th.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.language')}>
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">{t('settings.languageHint')}</p>
          <button
            onClick={fetchLangs}
            disabled={langFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={langFetch === 'loading' ? 'animate-spin' : ''} />
            {langFetch === 'idle' ? t('general.load') : t('general.refresh')}
          </button>
        </div>
        {langFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">{t('appearance.fetchLangsFailed')}</p>
        )}
        <div className="space-y-1 py-1">
          {allLangs.map((l) => (
            <button
              key={l.id}
              onClick={() => (language.id === l.id ? undefined : setLanguage(l))}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                language.id === l.id
                  ? 'bg-surface-raised'
                  : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <span className="text-xs text-text-primary flex-1">{l.name}</span>
              {language.id === l.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      {isDev && (
        <Section title={t('appearance.development')}>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs text-text-primary">{t('appearance.syncTitle')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('appearance.syncHint')}</p>
            </div>
            <button
              onClick={handleDevSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
            >
              {devSynced ? <VscCheck size={11} className="text-accent" /> : <VscSync size={11} />}
              {devSynced ? t('appearance.synced') : t('appearance.sync')}
            </button>
          </div>
        </Section>
      )}
    </>
  );
}

function mergeById<T>(base: T[], override: T[], getId: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(getId(item), item);
  for (const item of override) map.set(getId(item), item);
  return Array.from(map.values());
}
