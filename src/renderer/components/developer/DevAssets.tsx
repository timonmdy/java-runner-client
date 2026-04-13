import { THEME_COLOR_CATEGORIES, THEME_COLOR_LABELS } from '@shared/config/Dev.config';
import { ALL_LANGUAGES, ENGLISH_STRINGS } from '@shared/config/languages/Language.config';
import { ALL_THEMES } from '@shared/config/themes/Theme.config';
import type { LanguageDefinition } from '@shared/types/Language.types';
import type { ThemeColors, ThemeDefinition } from '@shared/types/Theme.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscCheck, VscCopy, VscGlobe, VscRefresh, VscSymbolColor } from 'react-icons/vsc';
import { useTheme } from '../../hooks/ThemeProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { Card, ScrollContent, Section } from '../common/layout/containers';

export function DevAssets() {
  const { theme, setTheme } = useTheme();
  const { language, t, setLanguage } = useTranslation();

  const totalKeys = Object.keys(ENGLISH_STRINGS).length;

  return (
    <ScrollContent>
      {/* ── Theme Editor ────────────────────────────────────────── */}
      <Section title={t('dev.themeEditor')} collapsible defaultCollapsed>
        <ThemeEditorPanel theme={theme} setTheme={setTheme} />
      </Section>

      {/* ── Languages ───────────────────────────────────────────── */}
      <Section
        title={`${t('settings.language')} (${ALL_LANGUAGES.length})`}
        collapsible
        defaultCollapsed
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            {ALL_LANGUAGES.map((item) => {
              const translated = Object.keys(item.strings).filter(
                (k) => k in ENGLISH_STRINGS
              ).length;
              const coverage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 100;
              return (
                <Card key={item.id} className="flex items-center gap-3 px-3 py-2">
                  <VscGlobe size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-primary truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-text-muted">
                      {coverage}% ({translated}/{totalKeys})
                    </p>
                  </div>
                  {language.id === item.id ? (
                    <span className="text-[10px] font-mono text-accent flex items-center gap-1">
                      <VscCheck size={10} /> {t('dev.activeLang')}
                    </span>
                  ) : (
                    <button
                      onClick={() => setLanguage(item)}
                      className="text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
                    >
                      {t('dev.apply')}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
          {language.id !== 'en' && <MissingKeysPanel language={language} totalKeys={totalKeys} />}
        </div>
      </Section>
    </ScrollContent>
  );
}

// ─── Theme Editor ───────────────────────────────────────────────────────────

function ThemeEditorPanel({
  theme,
  setTheme,
}: {
  theme: ThemeDefinition;
  setTheme: (t: ThemeDefinition) => void;
}) {
  const { t } = useTranslation();

  // The base theme the user selected (used for resetting)
  const [baseThemeId, setBaseThemeId] = useState(theme.id);
  const baseTheme = useMemo(
    () => ALL_THEMES.find((th) => th.id === baseThemeId) ?? ALL_THEMES[0],
    [baseThemeId]
  );

  // Live-edited colors (starts from current theme)
  const [editedColors, setEditedColors] = useState<ThemeColors>({
    ...theme.colors,
  });

  // Track which colors were modified from base
  const dirtyKeys = useMemo(() => {
    const dirty = new Set<keyof ThemeColors>();
    for (const key of Object.keys(baseTheme.colors) as (keyof ThemeColors)[]) {
      if (editedColors[key] !== baseTheme.colors[key]) dirty.add(key);
    }
    return dirty;
  }, [editedColors, baseTheme]);

  // Apply live preview whenever editedColors change.
  // Use a synthetic id so applyThemeToDOM never short-circuits for the builtin theme.
  useEffect(() => {
    const liveTheme: ThemeDefinition = {
      ...theme,
      id: `__live-preview__`,
      colors: editedColors,
    };
    setTheme(liveTheme);
  }, [editedColors]);

  // Switch base theme
  const handleBaseThemeChange = useCallback((th: ThemeDefinition) => {
    setBaseThemeId(th.id);
    setEditedColors({ ...th.colors });
  }, []);

  // Update a single color
  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setEditedColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset a single color to base
  const handleResetColor = useCallback(
    (key: keyof ThemeColors) => {
      setEditedColors((prev) => ({ ...prev, [key]: baseTheme.colors[key] }));
    },
    [baseTheme]
  );

  // Reset all colors to base
  const handleResetAll = useCallback(() => {
    setEditedColors({ ...baseTheme.colors });
  }, [baseTheme]);

  // Export current colors to clipboard as JSON
  const [copied, setCopied] = useState(false);
  const handleExport = useCallback(() => {
    const exportObj: ThemeDefinition = {
      id: 'custom-theme',
      name: 'Custom Theme',
      author: 'you',
      colors: editedColors,
    };
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editedColors]);

  // Import from clipboard
  const handleImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      if (parsed.colors && typeof parsed.colors === 'object') {
        const merged: ThemeColors = { ...editedColors };
        for (const key of Object.keys(editedColors) as (keyof ThemeColors)[]) {
          if (typeof parsed.colors[key] === 'string') {
            merged[key] = parsed.colors[key];
          }
        }
        setEditedColors(merged);
      }
    } catch {
      // silently ignore invalid clipboard
    }
  }, [editedColors]);

  return (
    <div className="space-y-3">
      {/* Hint */}
      <p className="text-[10px] font-mono text-text-muted">{t('dev.themeEditorHint')}</p>

      {/* Base theme selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_THEMES.map((th) => (
          <button
            key={th.id}
            onClick={() => handleBaseThemeChange(th)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
              baseThemeId === th.id
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-surface-border bg-base-900 text-text-muted hover:text-text-secondary'
            }`}
          >
            <div className="flex gap-0.5">
              {(['accent', 'base-900', 'text-primary'] as const).map((ck) => (
                <span
                  key={ck}
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-surface-border/50"
                  style={{ backgroundColor: th.colors[ck] }}
                />
              ))}
            </div>
            {th.name}
          </button>
        ))}
      </div>

      {/* Color editor grid */}
      <div className="space-y-3">
        {THEME_COLOR_CATEGORIES.map((cat) => (
          <div key={cat.labelKey}>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">
              {t(cat.labelKey as any)}
            </p>
            <div className="grid grid-cols-1 gap-1">
              {cat.keys.map((colorKey) => (
                <ColorRow
                  key={colorKey}
                  colorKey={colorKey}
                  label={THEME_COLOR_LABELS[colorKey] ?? colorKey}
                  value={editedColors[colorKey]}
                  isDirty={dirtyKeys.has(colorKey)}
                  onChange={(v) => handleColorChange(colorKey, v)}
                  onReset={() => handleResetColor(colorKey)}
                  resetLabel={t('dev.resetColor')}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live preview strip */}
      <div>
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">
          {t('dev.livePreview')}
        </p>
        <ThemePreviewStrip colors={editedColors} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleResetAll}
          disabled={dirtyKeys.size === 0}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border bg-base-900 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors disabled:opacity-30 disabled:cursor-default"
        >
          <VscRefresh size={10} />
          {t('dev.resetAll')}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border bg-base-900 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors"
        >
          <VscCopy size={10} />
          {copied ? t('dev.copiedToClipboard') : t('dev.exportTheme')}
        </button>
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border bg-base-900 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors"
        >
          <VscSymbolColor size={10} />
          {t('dev.importTheme')}
        </button>
      </div>
    </div>
  );
}

// ─── Color Row ──────────────────────────────────────────────────────────────

function ColorRow({
  colorKey,
  label,
  value,
  isDirty,
  onChange,
  onReset,
  resetLabel,
}: {
  colorKey: string;
  label: string;
  value: string;
  isDirty: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
  resetLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-base-900 border border-surface-border group">
      {/* Color swatch (click to open picker) */}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-5 h-5 rounded border border-surface-border shrink-0 cursor-pointer"
        style={{ backgroundColor: value }}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />

      {/* Label + key */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono text-text-primary truncate">{label}</p>
        <p className="text-[9px] font-mono text-text-muted truncate">{colorKey}</p>
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') onChange(v);
        }}
        onBlur={(e) => {
          if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
            // revert invalid input
            onChange(value);
          }
        }}
        className="w-[72px] px-1.5 py-0.5 rounded bg-base-800 border border-surface-border text-[10px] font-mono text-text-secondary text-center focus:outline-none focus:border-accent/50"
      />

      {/* Reset button (only visible when dirty) */}
      {isDirty && (
        <button
          onClick={onReset}
          className="text-[9px] font-mono text-text-muted hover:text-accent transition-colors shrink-0"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}

// ─── Theme Preview Strip ────────────────────────────────────────────────────

function ThemePreviewStrip({ colors }: { colors: ThemeColors }) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: colors['surface-border'] }}
    >
      {/* Fake title bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ backgroundColor: colors['base-950'] }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
        <span className="text-[10px] font-mono" style={{ color: colors['text-muted'] }}>
          preview.jar
        </span>
      </div>
      {/* Fake console area */}
      <div className="px-3 py-2 space-y-0.5" style={{ backgroundColor: colors['base-900'] }}>
        <p className="text-[10px] font-mono" style={{ color: colors['console-system'] }}>
          [System] Server starting...
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors['text-primary'] }}>
          Loading world "overworld"
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors['console-warn'] }}>
          [WARN] Deprecated config key found
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors['console-error'] }}>
          [ERROR] Failed to bind port 25565
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors['console-input'] }}>
          {'>'} reload confirm
        </p>
        <p className="text-[10px] font-mono" style={{ color: colors['text-secondary'] }}>
          Done (2.34s)! For help, type "help"
        </p>
      </div>
      {/* Fake toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{
          backgroundColor: colors['surface-raised'],
          borderTop: `1px solid ${colors['surface-border']}`,
        }}
      >
        <span
          className="px-2 py-0.5 rounded text-[9px] font-mono"
          style={{
            backgroundColor: colors.accent + '20',
            color: colors.accent,
          }}
        >
          Running
        </span>
        <span className="text-[9px] font-mono" style={{ color: colors['text-muted'] }}>
          6 lines
        </span>
      </div>
    </div>
  );
}

// ─── Missing Keys Panel ─────────────────────────────────────────────────────

function MissingKeysPanel({
  language,
  totalKeys,
}: {
  language: LanguageDefinition;
  totalKeys: number;
}) {
  const { t } = useTranslation();

  // "Hot reload" — re-evaluate missing keys on demand
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const allKeys = useMemo(() => Object.keys(ENGLISH_STRINGS), [refreshCount]);
  const missing = useMemo(
    () => allKeys.filter((k) => !(k in language.strings)),
    [allKeys, language, refreshCount]
  );

  const handleRefresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
    setLastRefresh(
      new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  if (missing.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/5">
          <VscCheck size={12} className="text-accent" />
          <p className="text-xs font-mono text-text-secondary">
            {t('dev.allKeysTranslated', { count: String(totalKeys) })}
          </p>
        </div>
        <RefreshBar lastRefresh={lastRefresh} onRefresh={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-surface-border bg-base-900">
        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
          <p className="text-xs font-mono text-yellow-400">
            {t('dev.missingKeyCount', { count: String(missing.length) })}
          </p>
        </div>
        <div className="max-h-48 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
          {missing.map((key) => (
            <div
              key={key}
              className="flex items-start gap-2 px-2 py-1 rounded hover:bg-surface-raised/30"
            >
              <span className="text-[10px] font-mono text-text-muted break-all select-text">
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
      <RefreshBar lastRefresh={lastRefresh} onRefresh={handleRefresh} />
    </div>
  );
}

// ─── Refresh bar for language hot-reload ────────────────────────────────────

function RefreshBar({
  lastRefresh,
  onRefresh,
}: {
  lastRefresh: string | null;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border bg-base-900 text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
      >
        <VscRefresh size={10} />
        {t('dev.refreshLanguage')}
      </button>
      {lastRefresh && (
        <span className="text-[9px] font-mono text-text-muted">
          {t('dev.lastRefreshed', { time: lastRefresh })}
        </span>
      )}
    </div>
  );
}
