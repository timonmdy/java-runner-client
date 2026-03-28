import { useState, useEffect } from 'react';
import { Section } from '../SettingsRow';
import { useTheme } from '../../../hooks/ThemeProvider';
import { useTranslation } from '../../../i18n/I18nProvider';
import { Tooltip } from '../../common/Tooltip';
import { VscSync, VscCheck, VscBeaker, VscArrowSwap } from 'react-icons/vsc';
import type {
  ThemeDefinition,
  ThemePreview,
  ThemePreviewColors,
} from '../../../../main/shared/types/Theme.types';
import type {
  LanguageDefinition,
  LanguagePreview,
} from '../../../../main/shared/types/Language.types';
import { ENGLISH } from '../../../../main/shared/config/DefaultLanguage.config';
import { BUILTIN_THEME } from '../../../../main/shared/config/Theme.config';
import type { JRCEnvironment } from '../../../../main/shared/types/App.types';

type FetchState = 'idle' | 'loading' | 'done' | 'error';

const THEME_SESSION_KEY = 'jrc:theme-previews';
const LANG_SESSION_KEY = 'jrc:lang-previews';

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

// ─── List item types ─────────────────────────────────────────────────────────

interface ThemeItem {
  id: string;
  name: string;
  previewColors: ThemePreviewColors;
  hasRemote: boolean;
  hasLocal: boolean;
  filename?: string;
  fullTheme?: ThemeDefinition;
}

interface LangItem {
  id: string;
  name: string;
  hasRemote: boolean;
  hasLocal: boolean;
  filename?: string;
  fullLang?: LanguageDefinition;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { language, t, setLanguage } = useTranslation();

  const [themePreviews, setThemePreviews] = useState<ThemePreview[]>(() =>
    readSession<ThemePreview>(THEME_SESSION_KEY)
  );
  const [langPreviews, setLangPreviews] = useState<LanguagePreview[]>(() =>
    readSession<LanguagePreview>(LANG_SESSION_KEY)
  );

  const [themesFetch, setThemesFetch] = useState<FetchState>(() =>
    readSession<ThemePreview>(THEME_SESSION_KEY).length > 0 ? 'done' : 'idle'
  );
  const [langsFetch, setLangsFetch] = useState<FetchState>(() =>
    readSession<LanguagePreview>(LANG_SESSION_KEY).length > 0 ? 'done' : 'idle'
  );

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [isDev, setIsDev] = useState(false);
  const [devThemes, setDevThemes] = useState<ThemeDefinition[]>([]);
  const [devLangs, setDevLangs] = useState<LanguageDefinition[]>([]);
  const [devSynced, setDevSynced] = useState(false);

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    window.env.get().then((env: JRCEnvironment) => setIsDev(env.type === 'dev'));
  }, []);

  // Auto-fetch previews on mount if not cached in session
  useEffect(() => {
    if (readSession(THEME_SESSION_KEY).length === 0) fetchThemePreviews();
    if (readSession(LANG_SESSION_KEY).length === 0) fetchLangPreviews();
  }, []);

  // Auto-load dev assets when dev mode detected
  useEffect(() => {
    if (isDev) syncDevAssets();
  }, [isDev]);

  // ─── Fetch handlers ──────────────────────────────────────────────────────

  const fetchThemePreviews = async () => {
    setThemesFetch('loading');
    const res = await window.api.fetchThemePreviews();
    if (res.ok && res.themes) {
      writeSession(THEME_SESSION_KEY, res.themes);
      setThemePreviews(res.themes);
      setThemesFetch('done');
    } else {
      setThemesFetch('error');
    }
  };

  const fetchLangPreviews = async () => {
    setLangsFetch('loading');
    const res = await window.api.fetchLanguagePreviews();
    if (res.ok && res.languages) {
      writeSession(LANG_SESSION_KEY, res.languages);
      setLangPreviews(res.languages);
      setLangsFetch('done');
    } else {
      setLangsFetch('error');
    }
  };

  const refreshThemes = () => {
    sessionStorage.removeItem(THEME_SESSION_KEY);
    setThemePreviews([]);
    fetchThemePreviews();
  };

  const refreshLangs = () => {
    sessionStorage.removeItem(LANG_SESSION_KEY);
    setLangPreviews([]);
    fetchLangPreviews();
  };

  const syncDevAssets = async () => {
    const assets = await window.api.loadDevAssets();
    setDevThemes(assets.themes);
    setDevLangs(assets.languages);
  };

  const handleDevSync = async () => {
    await syncDevAssets();
    setDevSynced(true);
    setTimeout(() => setDevSynced(false), 2000);
  };

  // ─── Selection handlers ──────────────────────────────────────────────────

  const selectTheme = async (item: ThemeItem) => {
    if (item.id === theme.id || loadingId) return;
    if (item.fullTheme) {
      setTheme(item.fullTheme);
      return;
    }
    if (!item.filename) return;
    setLoadingId(item.id);
    const res = await window.api.fetchThemeByFile(item.filename);
    setLoadingId(null);
    if (res.ok && res.theme) setTheme(res.theme);
  };

  const selectLang = async (item: LangItem) => {
    if (item.id === language.id || loadingId) return;
    if (item.fullLang) {
      setLanguage(item.fullLang);
      return;
    }
    if (!item.filename) return;
    setLoadingId(item.id);
    const res = await window.api.fetchLanguageByFile(item.filename);
    setLoadingId(null);
    if (res.ok && res.language) setLanguage(res.language);
  };

  // ─── Build lists ─────────────────────────────────────────────────────────

  const themeItems = buildThemeList(theme, themePreviews, isDev ? devThemes : []);
  const langItems = buildLangList(language, langPreviews, isDev ? devLangs : []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Section title={t('settings.theme')}>
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">{t('settings.themeHint')}</p>
          <button
            onClick={refreshThemes}
            disabled={themesFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={themesFetch === 'loading' ? 'animate-spin' : ''} />
            {t('general.refresh')}
          </button>
        </div>
        {themesFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">{t('appearance.fetchThemesFailed')}</p>
        )}
        <div className="space-y-1 py-1">
          {themeItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTheme(item)}
              disabled={loadingId === item.id}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                theme.id === item.id
                  ? 'bg-surface-raised'
                  : loadingId === item.id
                    ? 'bg-surface-raised/30 opacity-70'
                    : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <div className="flex gap-1 shrink-0">
                {(['accent', 'base-900', 'surface-raised', 'text-primary'] as const).map((key) => (
                  <span
                    key={key}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.previewColors[key] }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-primary flex-1">{item.name}</span>
              {isDev && <DevBadge hasLocal={item.hasLocal} hasRemote={item.hasRemote} />}
              {loadingId === item.id && (
                <VscSync size={11} className="animate-spin text-text-muted shrink-0" />
              )}
              {theme.id === item.id && loadingId !== item.id && (
                <VscCheck size={12} className="text-accent shrink-0" />
              )}
            </button>
          ))}
          {themesFetch === 'loading' && themePreviews.length === 0 && (
            <p className="px-3 py-2 text-xs text-text-muted font-mono animate-pulse">
              {t('general.loading')}
            </p>
          )}
        </div>
      </Section>

      <Section title={t('settings.language')}>
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-text-muted">{t('settings.languageHint')}</p>
          <button
            onClick={refreshLangs}
            disabled={langsFetch === 'loading'}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <VscSync size={11} className={langsFetch === 'loading' ? 'animate-spin' : ''} />
            {t('general.refresh')}
          </button>
        </div>
        {langsFetch === 'error' && (
          <p className="text-xs text-red-400 font-mono py-1">{t('appearance.fetchLangsFailed')}</p>
        )}
        <div className="space-y-1 py-1">
          {langItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectLang(item)}
              disabled={loadingId === item.id}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                language.id === item.id
                  ? 'bg-surface-raised'
                  : loadingId === item.id
                    ? 'bg-surface-raised/30 opacity-70'
                    : 'hover:bg-surface-raised/50 cursor-pointer',
              ].join(' ')}
            >
              <span className="text-xs text-text-primary flex-1">{item.name}</span>
              {isDev && <DevBadge hasLocal={item.hasLocal} hasRemote={item.hasRemote} />}
              {loadingId === item.id && (
                <VscSync size={11} className="animate-spin text-text-muted shrink-0" />
              )}
              {language.id === item.id && loadingId !== item.id && (
                <VscCheck size={12} className="text-accent shrink-0" />
              )}
            </button>
          ))}
          {langsFetch === 'loading' && langPreviews.length === 0 && (
            <p className="px-3 py-2 text-xs text-text-muted font-mono animate-pulse">
              {t('general.loading')}
            </p>
          )}
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
          <div className="flex items-center gap-4 pt-1 pb-2 text-[10px] font-mono text-text-muted">
            <span className="flex items-center gap-1">
              <VscBeaker size={10} /> {t('appearance.localOnly')}
            </span>
            <span className="flex items-center gap-1">
              <VscArrowSwap size={10} /> {t('appearance.localOverride')}
            </span>
          </div>
        </Section>
      )}
    </>
  );
}

// ─── Dev badge component ──────────────────────────────────────────────────────

function DevBadge({ hasLocal, hasRemote }: { hasLocal: boolean; hasRemote: boolean }) {
  const { t } = useTranslation();
  if (hasLocal && hasRemote) {
    return (
      <Tooltip content={t('appearance.localOverride')} side="left" delay={200}>
        <span className="text-text-muted shrink-0 cursor-default">
          <VscArrowSwap size={12} />
        </span>
      </Tooltip>
    );
  }
  if (hasLocal && !hasRemote) {
    return (
      <Tooltip content={t('appearance.localOnly')} side="left" delay={200}>
        <span className="text-text-muted shrink-0 cursor-default">
          <VscBeaker size={12} />
        </span>
      </Tooltip>
    );
  }
  return null;
}

// ─── List builders ────────────────────────────────────────────────────────────

function previewColorsFromTheme(th: ThemeDefinition): ThemePreviewColors {
  return {
    accent: th.colors.accent,
    'base-900': th.colors['base-900'],
    'surface-raised': th.colors['surface-raised'],
    'text-primary': th.colors['text-primary'],
  };
}

function buildThemeList(
  active: ThemeDefinition,
  remotePreviews: ThemePreview[],
  devThemes: ThemeDefinition[]
): ThemeItem[] {
  const items = new Map<string, ThemeItem>();

  // Active theme always first
  items.set(active.id, {
    id: active.id,
    name: active.name,
    previewColors: previewColorsFromTheme(active),
    hasRemote: false,
    hasLocal: false,
    fullTheme: active,
  });

  // Builtin theme always available (like English for languages)
  if (!items.has(BUILTIN_THEME.id)) {
    items.set(BUILTIN_THEME.id, {
      id: BUILTIN_THEME.id,
      name: BUILTIN_THEME.name,
      previewColors: previewColorsFromTheme(BUILTIN_THEME),
      hasRemote: false,
      hasLocal: false,
      fullTheme: BUILTIN_THEME,
    });
  }

  // Remote previews
  for (const p of remotePreviews) {
    const existing = items.get(p.id);
    if (existing) {
      existing.hasRemote = true;
      existing.filename = p.filename;
    } else {
      items.set(p.id, {
        id: p.id,
        name: p.name,
        previewColors: p.previewColors,
        hasRemote: true,
        hasLocal: false,
        filename: p.filename,
      });
    }
  }

  // Dev-local themes
  for (const dt of devThemes) {
    const existing = items.get(dt.id);
    if (existing) {
      existing.hasLocal = true;
      existing.fullTheme = dt;
      existing.previewColors = previewColorsFromTheme(dt);
    } else {
      items.set(dt.id, {
        id: dt.id,
        name: dt.name,
        previewColors: previewColorsFromTheme(dt),
        hasRemote: false,
        hasLocal: true,
        fullTheme: dt,
      });
    }
  }

  return Array.from(items.values());
}

function buildLangList(
  active: LanguageDefinition,
  remotePreviews: LanguagePreview[],
  devLangs: LanguageDefinition[]
): LangItem[] {
  const items = new Map<string, LangItem>();

  // Active language always first
  items.set(active.id, {
    id: active.id,
    name: active.name,
    hasRemote: false,
    hasLocal: false,
    fullLang: active,
  });

  // English always available
  if (!items.has(ENGLISH.id)) {
    items.set(ENGLISH.id, {
      id: ENGLISH.id,
      name: ENGLISH.name,
      hasRemote: false,
      hasLocal: false,
      fullLang: ENGLISH,
    });
  }

  // Remote previews
  for (const p of remotePreviews) {
    const existing = items.get(p.id);
    if (existing) {
      existing.hasRemote = true;
      existing.filename = p.filename;
    } else {
      items.set(p.id, {
        id: p.id,
        name: p.name,
        hasRemote: true,
        hasLocal: false,
        filename: p.filename,
      });
    }
  }

  // Dev-local languages
  for (const dl of devLangs) {
    const existing = items.get(dl.id);
    if (existing) {
      existing.hasLocal = true;
      existing.fullLang = dl;
    } else {
      items.set(dl.id, {
        id: dl.id,
        name: dl.name,
        hasRemote: false,
        hasLocal: true,
        fullLang: dl,
      });
    }
  }

  return Array.from(items.values());
}
