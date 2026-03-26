import React, { useState } from 'react';
import { Section, Row } from '../SettingsRow';
import { useTheme } from '../../../hooks/ThemeProvider';
import { useTranslation } from '../../../i18n/I18nProvider';
import { useDevMode } from '../../../hooks/useDevMode';
import { VscSync, VscCheck } from 'react-icons/vsc';
import { LuDownload } from 'react-icons/lu';
import type { ThemeDefinition } from '../../../../main/shared/types/Theme.types';
import type { LanguageDefinition } from '../../../../main/shared/types/Language.types';

type FetchState = 'idle' | 'loading' | 'done' | 'error';

export function AppearanceSection() {
  const { theme, setTheme, availableThemes, refreshThemes } = useTheme();
  const { language, setLanguage, availableLanguages, refreshLanguages } = useTranslation();
  const devMode = useDevMode();

  const [remoteThemes, setRemoteThemes] = useState<ThemeDefinition[]>([]);
  const [remoteLangs, setRemoteLangs] = useState<LanguageDefinition[]>([]);
  const [themeFetch, setThemeFetch] = useState<FetchState>('idle');
  const [langFetch, setLangFetch] = useState<FetchState>('idle');
  const [devSynced, setDevSynced] = useState(false);

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

  const installTheme = async (t: ThemeDefinition) => {
    await window.api.installTheme(t);
    await refreshThemes();
  };

  const installLang = async (l: LanguageDefinition) => {
    await window.api.installLanguage(l);
    await refreshLanguages();
  };

  const handleDevSync = async () => {
    await window.api.syncLocalDevAssets();
    await refreshThemes();
    await refreshLanguages();
    setDevSynced(true);
    setTimeout(() => setDevSynced(false), 2000);
  };

  return (
    <>
      <Section title="Theme">
        <div className="space-y-1.5 py-1">
          {availableThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                theme.id === t.id
                  ? 'bg-surface-raised'
                  : 'hover:bg-surface-raised/50',
              ].join(' ')}
            >
              <div className="flex gap-1 shrink-0">
                {['accent', 'base-900', 'surface-raised', 'text-primary'].map((key) => (
                  <span
                    key={key}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.colors[key as keyof typeof t.colors] }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-primary flex-1">{t.name}</span>
              {theme.id === t.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
        <div className="py-1">
          <button
            onClick={fetchThemes}
            disabled={themeFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={themeFetch === 'loading' ? 'animate-spin' : ''} />
            Browse themes from GitHub
          </button>
          <RemoteList
            state={themeFetch}
            items={remoteThemes}
            installed={availableThemes}
            onInstall={installTheme}
            getId={(t) => t.id}
            getVersion={(t) => t.version}
            getName={(t) => t.name}
            getAuthor={(t) => t.author}
            emptyLabel="No themes found on GitHub."
            errorLabel="Failed to fetch themes."
          />
        </div>
      </Section>

      <Section title="Language">
        <div className="space-y-1.5 py-1">
          {availableLanguages.map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                language.id === l.id
                  ? 'bg-surface-raised'
                  : 'hover:bg-surface-raised/50',
              ].join(' ')}
            >
              <span className="text-xs text-text-primary flex-1">{l.name}</span>
              {language.id === l.id && <VscCheck size={12} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
        <div className="py-1">
          <button
            onClick={fetchLangs}
            disabled={langFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={langFetch === 'loading' ? 'animate-spin' : ''} />
            Browse languages from GitHub
          </button>
          <RemoteList
            state={langFetch}
            items={remoteLangs}
            installed={availableLanguages}
            onInstall={installLang}
            getId={(l) => l.id}
            getVersion={(l) => l.version}
            getName={(l) => l.name}
            getAuthor={(l) => l.author}
            emptyLabel="No languages found on GitHub."
            errorLabel="Failed to fetch languages."
          />
        </div>
      </Section>

      {devMode && (
        <Section title="Development">
          <Row
            label="Sync local files"
            hint="Load themes and languages from project /themes and /languages directories"
          >
            <button
              onClick={handleDevSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
            >
              {devSynced ? <VscCheck size={11} className="text-accent" /> : <VscSync size={11} />}
              {devSynced ? 'Synced' : 'Sync'}
            </button>
          </Row>
        </Section>
      )}
    </>
  );
}

function RemoteList<T>({
  state,
  items,
  installed,
  onInstall,
  getId,
  getVersion,
  getName,
  getAuthor,
  emptyLabel,
  errorLabel,
}: {
  state: FetchState;
  items: T[];
  installed: T[];
  onInstall: (item: T) => void;
  getId: (item: T) => string;
  getVersion: (item: T) => number;
  getName: (item: T) => string;
  getAuthor: (item: T) => string;
  emptyLabel: string;
  errorLabel: string;
}) {
  if (state !== 'done' && state !== 'error') return null;
  if (state === 'error') return <p className="mt-2 text-xs text-red-400 font-mono">{errorLabel}</p>;
  if (items.length === 0) return <p className="mt-2 text-xs text-text-muted font-mono">{emptyLabel}</p>;

  return (
    <div className="mt-2 space-y-1">
      {items.map((item) => {
        const inst = installed.find((i) => getId(i) === getId(item));
        const isNewer = inst ? getVersion(item) > getVersion(inst) : true;
        return (
          <div
            key={getId(item)}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-base-900/50"
          >
            <div className="min-w-0">
              <p className="text-xs font-mono text-text-primary truncate">{getName(item)}</p>
              <p className="text-[10px] text-text-muted font-mono">
                v{getVersion(item)} by {getAuthor(item)}
              </p>
            </div>
            {inst && !isNewer ? (
              <span className="text-[10px] text-accent font-mono flex items-center gap-1">
                <VscCheck size={10} /> Installed
              </span>
            ) : (
              <button
                onClick={() => onInstall(item)}
                className="flex items-center gap-1 text-xs font-mono text-accent hover:text-text-primary transition-colors"
              >
                <LuDownload size={11} /> {inst ? 'Update' : 'Install'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
