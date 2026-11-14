import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, LANGUAGE_LOCALES, translate } from './i18n';

const LANG_KEY = 'duniatahu.lang';

const LanguageContext = createContext(null);

function readLanguage() {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    return LANGUAGES.includes(stored) ? stored : 'id';
  } catch {
    return 'id';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // mode privat — bahasa tetap jalan di sesi ini
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (LANGUAGES.includes(next)) setLangState(next);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      locale: LANGUAGE_LOCALES[lang],
      t: (key) => translate(lang, key),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}