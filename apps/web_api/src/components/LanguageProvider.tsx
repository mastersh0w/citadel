import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslations, type TranslationKeys } from '../utils/translations';

type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or default to 'ru'
    const stored = localStorage.getItem('citadel-language');
    return stored === 'en' ? 'en' : 'ru';
  });

  const t = useTranslations(language);

  useEffect(() => {
    // Save to localStorage when language changes
    localStorage.setItem('citadel-language', language);
    
    // Update document lang attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}