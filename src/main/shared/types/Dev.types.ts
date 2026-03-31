export type JsonToken = {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'plain';
  value: string;
};

import type { ThemeColors } from './Theme.types';

/** Groups theme color keys into logical categories for the editor UI. */
export type ThemeColorCategory = {
  labelKey: string;
  keys: (keyof ThemeColors)[];
};

/** Maps a theme color key to a human-readable label for the editor. */
export type ThemeColorLabel = {
  key: keyof ThemeColors;
  label: string;
};
