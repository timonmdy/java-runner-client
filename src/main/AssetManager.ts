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

export function getActiveTheme(): ThemeDefinition {
  try {
    const raw = fs.readFileSync(themeFilePath(), 'utf8');
    const state = JSON.parse(raw) as LocalThemeState;
    return state.activeTheme ?? BUILTIN_THEME;
  } catch {
    return BUILTIN_THEME;
  }
}

export function setActiveTheme(theme: ThemeDefinition): ThemeDefinition {
  const state: LocalThemeState = { activeThemeId: theme.id, activeTheme: theme };
  fs.writeFileSync(themeFilePath(), JSON.stringify(state, null, 2), 'utf8');
  return theme;
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

// ─── Languages ────────────────────────────────────────────────────────────────

const LANG_FILE = 'language-state.json';

function langFilePath(): string {
  return path.join(dataDir(), LANG_FILE);
}

export function getActiveLanguage(): LanguageDefinition {
  try {
    const raw = fs.readFileSync(langFilePath(), 'utf8');
    const state = JSON.parse(raw) as LocalLanguageState;
    return state.activeLanguage ?? ENGLISH;
  } catch {
    return ENGLISH;
  }
}

export function setActiveLanguage(lang: LanguageDefinition): LanguageDefinition {
  const state: LocalLanguageState = { activeLanguageId: lang.id, activeLanguage: lang };
  fs.writeFileSync(langFilePath(), JSON.stringify(state, null, 2), 'utf8');
  return lang;
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

// ─── Dev mode: load from local project directories ────────────────────────────

function projectRoot(): string {
  return path.join(__dirname, '..', '..');
}

function loadLocalDevThemes(): ThemeDefinition[] {
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

function loadLocalDevLanguages(): LanguageDefinition[] {
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

export function loadDevAssets(): { themes: ThemeDefinition[]; languages: LanguageDefinition[] } {
  return {
    themes: loadLocalDevThemes(),
    languages: loadLocalDevLanguages(),
  };
}
