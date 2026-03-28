export interface ThemeColors {
  accent: string;
  'base-950': string;
  'base-900': string;
  'base-800': string;
  'surface-raised': string;
  'surface-border': string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  'console-error': string;
  'console-warn': string;
  'console-input': string;
  'console-system': string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  version: number;
  author: string;
  colors: ThemeColors;
}

export interface LocalThemeState {
  activeThemeId: string;
  activeTheme: ThemeDefinition;
}

export type ThemePreviewColors = Pick<
  ThemeColors,
  'accent' | 'base-900' | 'surface-raised' | 'text-primary'
>;

export interface ThemePreview {
  id: string;
  name: string;
  filename: string;
  previewColors: ThemePreviewColors;
}
