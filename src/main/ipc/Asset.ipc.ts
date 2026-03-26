import type { RouteMap } from '../IPCController';
import {
  loadThemeState,
  getActiveTheme,
  setActiveTheme,
  fetchRemoteThemes,
  checkThemeUpdate,
  applyThemeUpdate,
  installTheme,
  loadLanguageState,
  getActiveLanguage,
  setActiveLanguage,
  fetchRemoteLanguages,
  checkLanguageUpdate,
  applyLanguageUpdate,
  installLanguage,
  syncLocalDevAssets,
} from '../AssetManager';
import type { ThemeDefinition } from '../shared/types/Theme.types';
import type { LanguageDefinition } from '../shared/types/Language.types';

export const AssetIPC = {
  // Themes
  getThemeState: {
    type: 'invoke',
    channel: 'asset:themeState',
    handler: () => loadThemeState(),
  },
  getActiveTheme: {
    type: 'invoke',
    channel: 'asset:activeTheme',
    handler: () => getActiveTheme(),
  },
  setActiveTheme: {
    type: 'invoke',
    channel: 'asset:setTheme',
    handler: (_e: any, id: string) => setActiveTheme(id),
  },
  fetchRemoteThemes: {
    type: 'invoke',
    channel: 'asset:fetchThemes',
    handler: () => fetchRemoteThemes(),
  },
  checkThemeUpdate: {
    type: 'invoke',
    channel: 'asset:checkThemeUpdate',
    handler: (_e: any, id: string) => checkThemeUpdate(id),
  },
  applyThemeUpdate: {
    type: 'invoke',
    channel: 'asset:applyThemeUpdate',
    handler: (_e: any, id: string) => applyThemeUpdate(id),
  },
  installTheme: {
    type: 'invoke',
    channel: 'asset:installTheme',
    handler: (_e: any, theme: ThemeDefinition) => installTheme(theme),
  },

  // Languages
  getLanguageState: {
    type: 'invoke',
    channel: 'asset:langState',
    handler: () => loadLanguageState(),
  },
  getActiveLanguage: {
    type: 'invoke',
    channel: 'asset:activeLang',
    handler: () => getActiveLanguage(),
  },
  setActiveLanguage: {
    type: 'invoke',
    channel: 'asset:setLang',
    handler: (_e: any, id: string) => setActiveLanguage(id),
  },
  fetchRemoteLanguages: {
    type: 'invoke',
    channel: 'asset:fetchLangs',
    handler: () => fetchRemoteLanguages(),
  },
  checkLanguageUpdate: {
    type: 'invoke',
    channel: 'asset:checkLangUpdate',
    handler: (_e: any, id: string) => checkLanguageUpdate(id),
  },
  applyLanguageUpdate: {
    type: 'invoke',
    channel: 'asset:applyLangUpdate',
    handler: (_e: any, id: string) => applyLanguageUpdate(id),
  },
  installLanguage: {
    type: 'invoke',
    channel: 'asset:installLang',
    handler: (_e: any, lang: LanguageDefinition) => installLanguage(lang),
  },
  syncLocalDevAssets: {
    type: 'invoke',
    channel: 'asset:syncDev',
    handler: () => syncLocalDevAssets(),
  },
} satisfies RouteMap;
