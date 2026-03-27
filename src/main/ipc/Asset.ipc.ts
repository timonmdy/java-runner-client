import type { RouteMap } from '../IPCController';
import {
  getActiveTheme,
  setActiveTheme,
  fetchRemoteThemes,
  getActiveLanguage,
  setActiveLanguage,
  fetchRemoteLanguages,
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

  // Dev
  loadDevAssets: {
    type: 'invoke',
    channel: 'asset:loadDevAssets',
    handler: () => loadDevAssets(),
  },
} satisfies RouteMap;
