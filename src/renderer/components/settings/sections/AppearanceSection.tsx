import { ALL_LANGUAGES } from '@shared/config/languages/Language.config';
import { ALL_THEMES } from '@shared/config/themes/Theme.config';
import type { ThemeColors } from '@shared/types/Theme.types';
import { useMemo, useState } from 'react';
import { VscCheck, VscSearch } from 'react-icons/vsc';
import { useTheme } from '../../../hooks/ThemeProvider';
import { useTranslation } from '../../../i18n/I18nProvider';

const PREVIEW_KEYS: (keyof ThemeColors)[] = [
  'accent',
  'base-900',
  'surface-raised',
  'text-primary',
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { language, t, setLanguage } = useTranslation();

  const [themeSearch, setThemeSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');

  const filteredThemes = useMemo(() => {
    if (!themeSearch) return ALL_THEMES;
    const q = themeSearch.toLowerCase();
    return ALL_THEMES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    );
  }, [themeSearch]);

  const filteredLangs = useMemo(() => {
    if (!langSearch) return ALL_LANGUAGES;
    const q = langSearch.toLowerCase();
    return ALL_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [langSearch]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Themes panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-0 max-h-[50%]">
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">
          {t('settings.theme')}
        </h3>
        <SearchInput
          value={themeSearch}
          onChange={setThemeSearch}
          placeholder={t('appearance.searchThemes')}
        />
        <div className="flex-1 min-h-0 overflow-y-auto mt-2 space-y-1 pr-1 scrollbar-thin">
          {filteredThemes.length === 0 ? (
            <p className="px-3 py-4 text-xs text-text-muted text-center">
              {t('appearance.noThemesFound')}
            </p>
          ) : (
            filteredThemes.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id !== theme.id && setTheme(item)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
                  theme.id === item.id
                    ? 'bg-surface-raised ring-1 ring-accent/20'
                    : 'hover:bg-surface-raised/50 cursor-pointer',
                ].join(' ')}
              >
                <div className="flex gap-1 shrink-0">
                  {PREVIEW_KEYS.map((key) => (
                    <span
                      key={key}
                      className="w-3.5 h-3.5 rounded-full ring-1 ring-surface-border/50"
                      style={{ backgroundColor: item.colors[key] }}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-primary flex-1 truncate">{item.name}</span>
                {theme.id === item.id && <VscCheck size={12} className="text-accent shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Languages panel ──────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-0 max-h-[50%]">
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">
          {t('settings.language')}
        </h3>
        <SearchInput
          value={langSearch}
          onChange={setLangSearch}
          placeholder={t('appearance.searchLanguages')}
        />
        <div className="flex-1 min-h-0 overflow-y-auto mt-2 space-y-1 pr-1 scrollbar-thin">
          {filteredLangs.length === 0 ? (
            <p className="px-3 py-4 text-xs text-text-muted text-center">
              {t('appearance.noLanguagesFound')}
            </p>
          ) : (
            filteredLangs.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id !== language.id && setLanguage(item)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
                  language.id === item.id
                    ? 'bg-surface-raised ring-1 ring-accent/20'
                    : 'hover:bg-surface-raised/50 cursor-pointer',
                ].join(' ')}
              >
                <span className="text-xs text-text-primary flex-1 truncate">{item.name}</span>
                {language.id === item.id && <VscCheck size={12} className="text-accent shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <VscSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-base-900 border border-surface-border rounded-md pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
      />
    </div>
  );
}
