import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { GITHUB_CONFIG } from './shared/config/GitHub.config';
import { BUILTIN_THEME, THEME_GITHUB_PATH } from './shared/config/Theme.config';
import { ENGLISH } from './shared/config/DefaultLanguage.config';
import type { ThemeDefinition, LocalThemeState } from './shared/types/Theme.types';
import type { LanguageDefinition, LocalLanguageState } from './shared/types/Language.types';

function dataDir(): string {
  return app.getPath('userData');
}

function httpsGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'java-runner-client' } };
    const req = https.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGetJson(res.headers.location));
        return;
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('JSON parse error'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function rawUrl(ghPath: string, filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${ghPath}/${filename}`;
}

function contentsUrl(ghPath: string): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${ghPath}`;
}

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEME_FILE = 'theme-state.json';

function themeFilePath(): string {
  return path.join(dataDir(), THEME_FILE);
}

export function loadThemeState(): LocalThemeState {
  try {
    const raw = fs.readFileSync(themeFilePath(), 'utf8');
    const state = JSON.parse(raw) as LocalThemeState;
    // Ensure builtin is always present
    if (!state.themes.find((t) => t.id === BUILTIN_THEME.id)) {
      state.themes.unshift(BUILTIN_THEME);
    }
    return state;
  } catch {
    return { activeThemeId: BUILTIN_THEME.id, themes: [BUILTIN_THEME] };
  }
}

export function saveThemeState(state: LocalThemeState): void {
  fs.writeFileSync(themeFilePath(), JSON.stringify(state, null, 2), 'utf8');
}

export function getActiveTheme(): ThemeDefinition {
  const state = loadThemeState();
  return state.themes.find((t) => t.id === state.activeThemeId) ?? BUILTIN_THEME;
}

export function setActiveTheme(themeId: string): ThemeDefinition {
  const state = loadThemeState();
  if (state.themes.find((t) => t.id === themeId)) {
    state.activeThemeId = themeId;
    saveThemeState(state);
  }
  return getActiveTheme();
}

export async function fetchRemoteThemes(): Promise<{
  ok: boolean;
  themes?: ThemeDefinition[];
  error?: string;
}> {
  try {
    const listing = await httpsGetJson(contentsUrl(THEME_GITHUB_PATH));
    if (!Array.isArray(listing)) return { ok: false, error: 'Themes folder not found' };
    const themes: ThemeDefinition[] = [];
    for (const f of (listing as Array<{ name: string }>).filter((f) => f.name.endsWith('.json'))) {
      try {
        const theme = (await httpsGetJson(rawUrl(THEME_GITHUB_PATH, f.name))) as ThemeDefinition;
        if (theme.id && theme.name && theme.colors) themes.push(theme);
      } catch {
        /* skip */
      }
    }
    return { ok: true, themes };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function checkThemeUpdate(
  themeId: string
): Promise<{ hasUpdate: boolean; remoteVersion: number; localVersion: number }> {
  const state = loadThemeState();
  const local = state.themes.find((t) => t.id === themeId);
  if (!local) return { hasUpdate: false, remoteVersion: 0, localVersion: 0 };

  const result = await fetchRemoteThemes();
  if (!result.ok || !result.themes)
    return { hasUpdate: false, remoteVersion: local.version, localVersion: local.version };

  const remote = result.themes.find((t) => t.id === themeId);
  if (!remote)
    return { hasUpdate: false, remoteVersion: local.version, localVersion: local.version };

  return {
    hasUpdate: remote.version > local.version,
    remoteVersion: remote.version,
    localVersion: local.version,
  };
}

export async function applyThemeUpdate(themeId: string): Promise<{ ok: boolean; error?: string }> {
  const result = await fetchRemoteThemes();
  if (!result.ok || !result.themes) return { ok: false, error: result.error ?? 'Fetch failed' };

  const remote = result.themes.find((t) => t.id === themeId);
  if (!remote) return { ok: false, error: 'Theme not found on remote' };

  const state = loadThemeState();
  const idx = state.themes.findIndex((t) => t.id === themeId);
  if (idx >= 0) state.themes[idx] = remote;
  else state.themes.push(remote);
  saveThemeState(state);
  return { ok: true };
}

export function installTheme(theme: ThemeDefinition): void {
  const state = loadThemeState();
  const idx = state.themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) state.themes[idx] = theme;
  else state.themes.push(theme);
  saveThemeState(state);
}

// ─── Languages ────────────────────────────────────────────────────────────────

const LANG_FILE = 'language-state.json';

function langFilePath(): string {
  return path.join(dataDir(), LANG_FILE);
}

export function loadLanguageState(): LocalLanguageState {
  try {
    const raw = fs.readFileSync(langFilePath(), 'utf8');
    const state = JSON.parse(raw) as LocalLanguageState;
    if (!state.languages.find((l) => l.id === ENGLISH.id)) {
      state.languages.unshift(ENGLISH);
    }
    return state;
  } catch {
    return { activeLanguageId: ENGLISH.id, languages: [ENGLISH] };
  }
}

export function saveLanguageState(state: LocalLanguageState): void {
  fs.writeFileSync(langFilePath(), JSON.stringify(state, null, 2), 'utf8');
}

export function getActiveLanguage(): LanguageDefinition {
  const state = loadLanguageState();
  return state.languages.find((l) => l.id === state.activeLanguageId) ?? ENGLISH;
}

export function setActiveLanguage(langId: string): LanguageDefinition {
  const state = loadLanguageState();
  if (state.languages.find((l) => l.id === langId)) {
    state.activeLanguageId = langId;
    saveLanguageState(state);
  }
  return getActiveLanguage();
}

export async function fetchRemoteLanguages(): Promise<{
  ok: boolean;
  languages?: LanguageDefinition[];
  error?: string;
}> {
  try {
    const listing = await httpsGetJson(contentsUrl(GITHUB_CONFIG.languagesPath));
    if (!Array.isArray(listing)) return { ok: false, error: 'Languages folder not found' };
    const languages: LanguageDefinition[] = [];
    for (const f of (listing as Array<{ name: string }>).filter((f) => f.name.endsWith('.json'))) {
      try {
        const lang = (await httpsGetJson(
          rawUrl(GITHUB_CONFIG.languagesPath, f.name)
        )) as LanguageDefinition;
        if (lang.id && lang.name && lang.strings) languages.push(lang);
      } catch {
        /* skip */
      }
    }
    return { ok: true, languages };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function checkLanguageUpdate(
  langId: string
): Promise<{ hasUpdate: boolean; remoteVersion: number; localVersion: number }> {
  const state = loadLanguageState();
  const local = state.languages.find((l) => l.id === langId);
  if (!local) return { hasUpdate: false, remoteVersion: 0, localVersion: 0 };

  const result = await fetchRemoteLanguages();
  if (!result.ok || !result.languages)
    return { hasUpdate: false, remoteVersion: local.version, localVersion: local.version };

  const remote = result.languages.find((l) => l.id === langId);
  if (!remote)
    return { hasUpdate: false, remoteVersion: local.version, localVersion: local.version };

  return {
    hasUpdate: remote.version > local.version,
    remoteVersion: remote.version,
    localVersion: local.version,
  };
}

export async function applyLanguageUpdate(
  langId: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await fetchRemoteLanguages();
  if (!result.ok || !result.languages) return { ok: false, error: result.error ?? 'Fetch failed' };

  const remote = result.languages.find((l) => l.id === langId);
  if (!remote) return { ok: false, error: 'Language not found on remote' };

  const state = loadLanguageState();
  const idx = state.languages.findIndex((l) => l.id === langId);
  if (idx >= 0) state.languages[idx] = remote;
  else state.languages.push(remote);
  saveLanguageState(state);
  return { ok: true };
}

export function installLanguage(lang: LanguageDefinition): void {
  const state = loadLanguageState();
  const idx = state.languages.findIndex((l) => l.id === lang.id);
  if (idx >= 0) state.languages[idx] = lang;
  else state.languages.push(lang);
  saveLanguageState(state);
}

// ─── Dev mode: load from local project directories ────────────────────────────

function projectRoot(): string {
  return path.join(__dirname, '..', '..');
}

export function loadLocalDevThemes(): ThemeDefinition[] {
  const dir = path.join(projectRoot(), 'themes');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        const theme = JSON.parse(raw) as ThemeDefinition;
        if (theme.id && theme.name && theme.colors) return theme;
      } catch {
        /* skip */
      }
      return null;
    })
    .filter((t): t is ThemeDefinition => t !== null);
}

export function loadLocalDevLanguages(): LanguageDefinition[] {
  const dir = path.join(projectRoot(), 'languages');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        const lang = JSON.parse(raw) as LanguageDefinition;
        if (lang.id && lang.name && lang.strings) return lang;
      } catch {
        /* skip */
      }
      return null;
    })
    .filter((l): l is LanguageDefinition => l !== null);
}

export function syncLocalDevAssets(): { themes: number; languages: number } {
  let tc = 0;
  let lc = 0;
  for (const theme of loadLocalDevThemes()) {
    installTheme(theme);
    tc++;
  }
  for (const lang of loadLocalDevLanguages()) {
    installLanguage(lang);
    lc++;
  }
  return { themes: tc, languages: lc };
}
