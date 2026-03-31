import type { JsonToken, ThemeColorCategory } from '../types/Dev.types';

export const JSON_TOKEN_COLORS: Record<JsonToken['type'], string> = {
  key: 'text-blue-300',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  boolean: 'text-purple-400',
  null: 'text-red-400/80',
  punct: 'text-text-muted',
  plain: 'text-text-secondary',
};

/** Colour categories shown in the theme editor. Order here = order in UI. */
export const THEME_COLOR_CATEGORIES: ThemeColorCategory[] = [
  {
    labelKey: 'dev.colorCategories.accent',
    keys: ['accent'],
  },
  {
    labelKey: 'dev.colorCategories.base',
    keys: ['base-950', 'base-900', 'base-800'],
  },
  {
    labelKey: 'dev.colorCategories.surface',
    keys: ['surface-raised', 'surface-border'],
  },
  {
    labelKey: 'dev.colorCategories.text',
    keys: ['text-primary', 'text-secondary', 'text-muted'],
  },
  {
    labelKey: 'dev.colorCategories.console',
    keys: ['console-error', 'console-warn', 'console-input', 'console-system'],
  },
];

/** Human-readable labels for each ThemeColors key (used in the editor). */
export const THEME_COLOR_LABELS: Record<string, string> = {
  accent: 'Accent',
  'base-950': 'Base 950',
  'base-900': 'Base 900',
  'base-800': 'Base 800',
  'surface-raised': 'Surface Raised',
  'surface-border': 'Surface Border',
  'text-primary': 'Text Primary',
  'text-secondary': 'Text Secondary',
  'text-muted': 'Text Muted',
  'console-error': 'Console Error',
  'console-warn': 'Console Warn',
  'console-input': 'Console Input',
  'console-system': 'Console System',
};
