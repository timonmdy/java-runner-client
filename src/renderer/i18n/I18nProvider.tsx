import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { LanguageDefinition } from '../../main/shared/types/Language.types';
import { ENGLISH } from '../../main/shared/config/DefaultLanguage.config';
import type { TranslationKey } from './TranslationKeys';

interface I18nContextValue {
  language: LanguageDefinition;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  setLanguage: (lang: LanguageDefinition) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<LanguageDefinition>(ENGLISH);
  const langRef = useRef<LanguageDefinition>(ENGLISH);

  useEffect(() => {
    langRef.current = language;
  }, [language]);

  useEffect(() => {
    if (!window.api) return;
    window.api.getActiveLanguage().then((l) => {
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

  const setLanguage = useCallback(async (lang: LanguageDefinition) => {
    if (!window.api) return;
    const result = await window.api.setActiveLanguage(lang);
    langRef.current = result;
    setLang(result);
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
