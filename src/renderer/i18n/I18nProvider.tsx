import { ALL_LANGUAGES, ENGLISH } from '@shared/config/languages/Language.config';
import type { LanguageDefinition } from '@shared/types/Language.types';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { TranslationKey } from './TranslationKeys';

interface I18nContextValue {
  language: LanguageDefinition;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  setLanguage: (lang: LanguageDefinition) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveLanguage(id: string): LanguageDefinition {
  return ALL_LANGUAGES.find((l) => l.id === id) ?? ENGLISH;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<LanguageDefinition>(ENGLISH);
  const langRef = useRef<LanguageDefinition>(ENGLISH);

  useEffect(() => {
    langRef.current = language;
  }, [language]);

  useEffect(() => {
    if (!window.api) return;
    window.api.getSettings().then((s) => {
      const l = resolveLanguage(s.languageId);
      setLang(l);
      langRef.current = l;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>) => {
      const strings = language.strings;
      let str = strings[key] ?? ENGLISH.strings[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [language]
  );

  const setLanguage = useCallback((lang: LanguageDefinition) => {
    if (!window.api) return;
    langRef.current = lang;
    setLang(lang);
    window.api.getSettings().then((s) => {
      window.api.saveSettings({ ...s, languageId: lang.id });
    });
  }, []);

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>{children}</I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
