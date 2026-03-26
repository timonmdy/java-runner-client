import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeDefinition, ThemeColors } from '../../main/shared/types/Theme.types';
import { BUILTIN_THEME } from '../../main/shared/config/Theme.config';

interface ThemeContextValue {
  theme: ThemeDefinition;
  setTheme: (id: string) => Promise<void>;
  availableThemes: ThemeDefinition[];
  refreshThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STYLE_ID = 'jrc-theme-override';

/**
 * Generates a <style> block that overrides Tailwind's hardcoded color utilities.
 * Only injected when a non-default theme is active.
 * Maps each theme color key to the Tailwind utility classes that reference it.
 */
function buildThemeCSS(colors: ThemeColors): string {
  const map: Record<keyof ThemeColors, string> = {
    accent: 'accent',
    'base-950': 'base-950',
    'base-900': 'base-900',
    'base-800': 'base-800',
    'surface-raised': 'surface-raised',
    'surface-border': 'surface-border',
    'text-primary': 'text-primary',
    'text-secondary': 'text-secondary',
    'text-muted': 'text-muted',
    'console-error': 'console-error',
    'console-warn': 'console-warn',
    'console-input': 'console-input',
    'console-system': 'console-system',
  };

  const lines: string[] = [':root {'];
  for (const [key, twName] of Object.entries(map)) {
    const hex = colors[key as keyof ThemeColors];
    if (hex) lines.push(`  --tw-theme-${twName}: ${hex};`);
  }
  lines.push('}');

  // Override bg, text, border, divide utilities
  for (const [key, twName] of Object.entries(map)) {
    const hex = colors[key as keyof ThemeColors];
    if (!hex) continue;
    const v = `var(--tw-theme-${twName})`;
    lines.push(`.bg-${CSS.escape(twName)} { background-color: ${v} !important; }`);
    lines.push(`.text-${CSS.escape(twName)} { color: ${v} !important; }`);
    lines.push(`.border-${CSS.escape(twName)} { border-color: ${v} !important; }`);
    lines.push(`.divide-${CSS.escape(twName)} > :not([hidden]) ~ :not([hidden]) { border-color: ${v} !important; }`);
  }

  // Handle body background + color
  lines.push(`body { background: ${colors['base-950']}; color: ${colors['text-primary']}; }`);

  return lines.join('\n');
}

function applyThemeToDOM(theme: ThemeDefinition) {
  const existing = document.getElementById(STYLE_ID);

  if (theme.id === BUILTIN_THEME.id) {
    existing?.remove();
    return;
  }

  const css = buildThemeCSS(theme.colors);
  if (existing) {
    existing.textContent = css;
  } else {
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDefinition>(BUILTIN_THEME);
  const [available, setAvailable] = useState<ThemeDefinition[]>([BUILTIN_THEME]);

  useEffect(() => {
    if (!window.api) return;
    window.api.getActiveTheme().then((t) => {
      setThemeState(t);
      applyThemeToDOM(t);
    });
    window.api.getThemeState().then((s) => setAvailable(s.themes));
  }, []);

  const setTheme = useCallback(async (id: string) => {
    if (!window.api) return;
    const t = await window.api.setActiveTheme(id);
    setThemeState(t);
    applyThemeToDOM(t);
  }, []);

  const refreshThemes = useCallback(async () => {
    if (!window.api) return;
    const state = await window.api.getThemeState();
    setAvailable(state.themes);
    const active = state.themes.find((t) => t.id === state.activeThemeId) ?? BUILTIN_THEME;
    setThemeState(active);
    applyThemeToDOM(active);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: available, refreshThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
