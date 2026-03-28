import type { RouteMap } from '../IPCController';
import {
  getActiveTheme,
  setActiveTheme,
  fetchRemoteThemes,
  fetchRemoteThemePreviews,
  fetchRemoteThemeByFile,
  getActiveLanguage,
  setActiveLanguage,
  fetchRemoteLanguages,
  fetchRemoteLanguagePreviews,
  fetchRemoteLanguageByFile,
  loadDevAssets,
} from '../AssetManager';
import type { ThemeDefinition } from '../shared/types/Theme.types';
import type { LanguageDefinition } from '../shared/types/Language.types';

export const AssetIPC = {
  // Themes
  getActiveTheme: {
    type: 'invoke',
    channel: 'asset:activeTheme',
    handler: () => getActiveTheme(),
  },
  setActiveTheme: {
    type: 'invoke',
    channel: 'asset:setTheme',
    handler: (_e: any, theme: ThemeDefinition) => setActiveTheme(theme),
  },
  fetchRemoteThemes: {
    type: 'invoke',
    channel: 'asset:fetchThemes',
    handler: () => fetchRemoteThemes(),
  },
  fetchThemePreviews: {
    type: 'invoke',
    channel: 'asset:themePreviews',
    handler: () => fetchRemoteThemePreviews(),
  },
  fetchThemeByFile: {
    type: 'invoke',
    channel: 'asset:themeByFile',
    handler: (_e: any, filename: string) => fetchRemoteThemeByFile(filename),
  },

  // Languages
  getActiveLanguage: {
    type: 'invoke',
    channel: 'asset:activeLang',
    handler: () => getActiveLanguage(),
  },
  setActiveLanguage: {
    type: 'invoke',
    channel: 'asset:setLang',
    handler: (_e: any, lang: LanguageDefinition) => setActiveLanguage(lang),
  },
  fetchRemoteLanguages: {
    type: 'invoke',
    channel: 'asset:fetchLangs',
    handler: () => fetchRemoteLanguages(),
  },
  fetchLanguagePreviews: {
    type: 'invoke',
    channel: 'asset:langPreviews',
    handler: () => fetchRemoteLanguagePreviews(),
  },
  fetchLanguageByFile: {
    type: 'invoke',
    channel: 'asset:langByFile',
    handler: (_e: any, filename: string) => fetchRemoteLanguageByFile(filename),
  },

  // Dev
  loadDevAssets: {
    type: 'invoke',
    channel: 'asset:loadDevAssets',
    handler: () => loadDevAssets(),
  },
} satisfies RouteMap;
