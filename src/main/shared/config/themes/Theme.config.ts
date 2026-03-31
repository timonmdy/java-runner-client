import type { ThemeDefinition } from '../../types/Theme.types';
import { DARK_DEFAULT_THEME } from './dark-default.theme';
import { LIGHT_THEME } from './light.theme';
import { MIDNIGHT_BLUE_THEME } from './midnight-blue.theme';

export const BUILTIN_THEME: ThemeDefinition = DARK_DEFAULT_THEME;

export const ALL_THEMES: ThemeDefinition[] = [DARK_DEFAULT_THEME, LIGHT_THEME, MIDNIGHT_BLUE_THEME];

/** CSS variable prefix used in tailwind.config.js */
export const CSS_VAR_PREFIX = '--c-';
