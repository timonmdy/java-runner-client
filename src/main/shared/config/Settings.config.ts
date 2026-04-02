import { REST_API_CONFIG } from './API.config';
import {
  AnyFieldDef,
  extractDefaults,
  InferSettings,
  NoteDef,
  NumberDef,
  RangeDef,
  SettingSidebarTopic,
  TextDef,
  ToggleDef,
} from '../types/Settings.types';

// ─── Section registry ──────────────────────────────────────────────────────
// Add a new entry here when adding a new settings section.

export type SettingSection = 'general' | 'console' | 'appearance' | 'advanced' | 'about';

export const SETTINGS_TOPICS: SettingSidebarTopic<SettingSection>[] = [
  { id: 'general', label: 'General' },
  { id: 'console', label: 'Console' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'about', label: 'About' },
];

// ─── Schema ────────────────────────────────────────────────────────────────

export const SETTINGS_SCHEMA = {
  // ── General › Startup ────────────────────────────────────────────────────
  launchOnStartup: {
    type: 'toggle',
    default: false,
    section: 'general',
    group: 'settings.startup',
    label: 'settings.launchOnStartup',
    hint: 'settings.launchOnStartupHint',
  } as ToggleDef,

  startMinimized: {
    type: 'toggle',
    default: false,
    section: 'general',
    group: 'settings.startup',
    label: 'settings.startMinimized',
    hint: 'settings.startMinimizedHint',
    sub: true,
    disabledWhen: (s: any) => !s.launchOnStartup,
  } as ToggleDef,

  minimizeToTray: {
    type: 'toggle',
    default: true,
    section: 'general',
    group: 'settings.startup',
    label: 'settings.minimizeToTray',
    hint: 'settings.minimizeToTrayHint',
  } as ToggleDef,

  // ── Console ───────────────────────────────────────────────────────────────
  consoleFontSize: {
    type: 'range',
    default: 13,
    section: 'console',
    group: 'settings.console',
    label: 'settings.fontSize',
    hint: 'settings.fontSizeHint',
    min: 10,
    max: 20,
    step: 1,
    unit: 'px',
  } as RangeDef,

  consoleLineNumbers: {
    type: 'toggle',
    default: false,
    section: 'console',
    group: 'settings.console',
    label: 'settings.lineNumbers',
    hint: 'settings.lineNumbersHint',
  } as ToggleDef,

  consoleTimestamps: {
    type: 'toggle',
    default: false,
    section: 'console',
    group: 'settings.console',
    label: 'settings.timestamps',
    hint: 'settings.timestampsHint',
  } as ToggleDef,

  consoleWordWrap: {
    type: 'toggle',
    default: false,
    section: 'console',
    group: 'settings.console',
    label: 'settings.wordWrap',
    hint: 'settings.wordWrapHint',
  } as ToggleDef,

  consoleMaxLines: {
    type: 'number',
    default: 5000,
    section: 'console',
    group: 'settings.console',
    label: 'settings.maxLines',
    hint: 'settings.maxLinesHint',
    min: 500,
    max: 50000,
    step: 500,
  } as NumberDef,

  consoleHistorySize: {
    type: 'number',
    default: 200,
    section: 'console',
    group: 'settings.console',
    label: 'settings.historySize',
    hint: 'settings.historySizeHint',
    min: 10,
    max: 2000,
    step: 10,
  } as NumberDef,

  // ── Appearance (managed by ThemeProvider / I18nProvider) ──────────────────
  themeId: {
    type: 'text',
    default: 'dark-default',
    section: 'appearance',
    group: 'settings.theme',
    label: 'settings.theme',
  } as TextDef,

  languageId: {
    type: 'text',
    default: 'en',
    section: 'appearance',
    group: 'settings.language',
    label: 'settings.language',
  } as TextDef,

  // ── Advanced › Dev Mode ───────────────────────────────────────────────────
  devModeEnabled: {
    type: 'toggle',
    default: false,
    section: 'advanced',
    group: 'settings.devMode',
    label: 'settings.devModeLabel',
    hint: 'settings.devModeHint',
  } as ToggleDef,

  // ── Advanced › REST API ───────────────────────────────────────────────────
  restApiEnabled: {
    type: 'toggle',
    default: false,
    section: 'advanced',
    group: 'settings.restApi',
    label: 'settings.restApiLabel',
    hint: 'settings.restApiHint',
    hintParams: { port: String(REST_API_CONFIG.defaultPort) },
  } as ToggleDef,

  restApiPort: {
    type: 'number',
    default: REST_API_CONFIG.defaultPort,
    section: 'advanced',
    group: 'settings.restApi',
    label: 'settings.restApiPort',
    hint: 'settings.restApiPortHint',
    sub: true,
    min: 1024,
    max: 65535,
    step: 1,
    showWhen: (s: any) => s.restApiEnabled,
  } as NumberDef,

  restApiNote: {
    type: 'note',
    section: 'advanced',
    group: 'settings.restApi',
    showWhen: (s: any) => s.restApiEnabled,
    content: (s: any) => [
      `http://${REST_API_CONFIG.host}:${s.restApiPort}/api`,
      '/status · /profiles · /processes · /logs · /settings',
    ],
    accentPattern: /https?:\/\/[^\s]+/,
  } as NoteDef,
} satisfies Record<string, AnyFieldDef>;

// ─── Derived exports ───────────────────────────────────────────────────────

export type AppSettings = InferSettings<typeof SETTINGS_SCHEMA>;
export const DEFAULT_SETTINGS = extractDefaults(SETTINGS_SCHEMA);
