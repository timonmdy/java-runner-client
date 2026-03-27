import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeDefinition, ThemeColors } from '../../main/shared/types/Theme.types';
import { BUILTIN_THEME } from '../../main/shared/config/Theme.config';

interface ThemeContextValue {
  theme: ThemeDefinition;
  setTheme: (theme: ThemeDefinition) => Promise<void>;
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
  const OPACITY_STEPS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  for (const [key, twName] of Object.entries(map)) {
    const hex = colors[key as keyof ThemeColors];
    if (!hex) continue;
    const v = `var(--tw-theme-${twName})`;
    lines.push(`.bg-${CSS.escape(twName)} { background-color: ${v} !important; }`);
    lines.push(`.text-${CSS.escape(twName)} { color: ${v} !important; }`);
    lines.push(`.border-${CSS.escape(twName)} { border-color: ${v} !important; }`);
    lines.push(
      `.divide-${CSS.escape(twName)} > :not([hidden]) ~ :not([hidden]) { border-color: ${v} !important; }`
    );
    // Opacity modifier variants (e.g. bg-base-900/50, border-surface-border/30)
    for (const op of OPACITY_STEPS) {
      const mix = `color-mix(in srgb, ${v} ${op}%, transparent)`;
      const esc = CSS.escape(`${twName}/${op}`);
      lines.push(`.bg-${esc} { background-color: ${mix} !important; }`);
      lines.push(`.border-${esc} { border-color: ${mix} !important; }`);
      lines.push(`.text-${esc} { color: ${mix} !important; }`);
    }

    // Hover variants
    lines.push(`.${CSS.escape(`hover:bg-${twName}`)}:hover { background-color: ${v} !important; }`);
    lines.push(`.${CSS.escape(`hover:text-${twName}`)}:hover { color: ${v} !important; }`);
    lines.push(`.${CSS.escape(`hover:border-${twName}`)}:hover { border-color: ${v} !important; }`);
    for (const op of OPACITY_STEPS) {
      const mix = `color-mix(in srgb, ${v} ${op}%, transparent)`;
      lines.push(
        `.${CSS.escape(`hover:bg-${twName}/${op}`)}:hover { background-color: ${mix} !important; }`
      );
      lines.push(
        `.${CSS.escape(`hover:border-${twName}/${op}`)}:hover { border-color: ${mix} !important; }`
      );
      lines.push(
        `.${CSS.escape(`hover:text-${twName}/${op}`)}:hover { color: ${mix} !important; }`
      );
    }
  }

  // Handle body background + color
  lines.push(`body { background: ${colors['base-950']}; color: ${colors['text-primary']}; }`);

  return lines.join('\n');
}

function applyThemeToDOM(theme: ThemeDefinition) {
  const existing = document.getElementById(STYLE_ID);

  if (theme.id === BUILTIN_THEME.id) {
    existing?.remove();
    localStorage.removeItem('jrc:theme-bg');
    document.documentElement.style.background = '';
    return;
  }

  localStorage.setItem('jrc:theme-bg', theme.colors['base-950']);
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

  useEffect(() => {
    if (!window.api) return;
    window.api.getActiveTheme().then((t) => {
      setThemeState(t);
      applyThemeToDOM(t);
    });
  }, []);

  const setTheme = useCallback(async (theme: ThemeDefinition) => {
    if (!window.api) return;
    const t = await window.api.setActiveTheme(theme);
    setThemeState(t);
    applyThemeToDOM(t);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
