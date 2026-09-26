import React, { createContext, useContext, useState } from 'react';
import { translations, Language } from '../i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.vi;
  availableLanguages: Array<{ code: Language; name: string; flag: string }>;
}

const AVAILABLE_LANGUAGES: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('aurameet_lang') as Language;
      if (saved && ['vi', 'en', 'es', 'zh', 'ja'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    // Default language is Vietnamese (Tiếng Việt) as requested
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('aurameet_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = translations[language] || translations.vi;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, availableLanguages: AVAILABLE_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
