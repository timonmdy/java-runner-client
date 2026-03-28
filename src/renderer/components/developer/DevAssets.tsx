import { ALL_LANGUAGES, ENGLISH_STRINGS } from '@shared/config/Language.config';
import { ALL_THEMES } from '@shared/config/Theme.config';
import type { LanguageDefinition } from '@shared/types/Language.types';
import React from 'react';
import { VscCheck, VscGlobe } from 'react-icons/vsc';
import { useTheme } from '../../hooks/ThemeProvider';
import { useTranslation } from '../../i18n/I18nProvider';

export function DevAssets() {
  const { theme, setTheme } = useTheme();
  const { language, t, setLanguage } = useTranslation();

  const totalKeys = Object.keys(ENGLISH_STRINGS).length;

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="px-4 py-4 space-y-5">
        {/* ── Themes ──────────────────────────────────────────────────── */}
        <Section title={`${t('settings.theme')} (${ALL_THEMES.length})`}>
          <div className="space-y-1.5">
            {ALL_THEMES.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-surface-border bg-base-900"
              >
                <div className="flex gap-1 shrink-0">
                  {(
                    ['accent', 'base-900', 'base-800', 'surface-raised', 'text-primary'] as const
                  ).map((key) => (
                    <span
                      key={key}
                      className="w-3 h-3 rounded-full ring-1 ring-surface-border/50"
                      style={{ backgroundColor: item.colors[key] }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-text-primary truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-text-muted">{item.author}</p>
                </div>
                <SourceBadge label={t('dev.bundled')} />
                {theme.id === item.id ? (
                  <span className="text-[10px] font-mono text-accent flex items-center gap-1">
                    <VscCheck size={10} /> {t('dev.activeTheme')}
                  </span>
                ) : (
                  <button
                    onClick={() => setTheme(item)}
                    className="text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
                  >
                    {t('dev.apply')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Languages ───────────────────────────────────────────────── */}
        <Section title={`${t('settings.language')} (${ALL_LANGUAGES.length})`}>
          <div className="space-y-1.5">
            {ALL_LANGUAGES.map((item) => {
              const translated = Object.keys(item.strings).filter(
                (k) => k in ENGLISH_STRINGS
              ).length;
              const coverage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 100;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-surface-border bg-base-900"
                >
                  <VscGlobe size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-primary truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-text-muted">
                      {coverage}% ({translated}/{totalKeys})
                    </p>
                  </div>
                  <SourceBadge label={t('dev.bundled')} />
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
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Missing Keys ────────────────────────────────────────────── */}
        {language.id !== 'en' && (
          <Section title={t('dev.missingKeys')}>
            <MissingKeysPanel language={language} totalKeys={totalKeys} />
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Reusable pieces ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 bg-accent/10 border-accent/20 text-accent">
      {label}
    </span>
  );
}

function MissingKeysPanel({
  language,
  totalKeys,
}: {
  language: LanguageDefinition;
  totalKeys: number;
}) {
  const allKeys = Object.keys(ENGLISH_STRINGS);
  const missing = allKeys.filter((k) => !(k in language.strings));

  if (missing.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/5">
        <VscCheck size={12} className="text-accent" />
        <p className="text-xs font-mono text-text-secondary">All {totalKeys} keys translated</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-border bg-base-900">
      <div className="px-3 py-2 border-b border-surface-border">
        <p className="text-xs font-mono text-yellow-400">
          {missing.length} missing key{missing.length !== 1 ? 's' : ''}
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
  );
}
