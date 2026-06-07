"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'English' | 'Traditional Chinese' | 'Simplified Chinese';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language;
    // Update to use 'Traditional Chinese' instead of 'Cantonese'
    if (savedLang === 'English' || savedLang === 'Traditional Chinese' || savedLang === 'Simplified Chinese') {
      setLanguage(savedLang);
    } else if (savedLang === 'Cantonese') {
      // Migrate old 'Cantonese' to 'Traditional Chinese'
      setLanguage('Traditional Chinese');
      localStorage.setItem('language', 'Traditional Chinese');
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const translations: Record<Language, any> = {
    English: {
      analyzing: 'Analyzing...',
      loading: 'Loading...',
      analyzingMarket: 'Analyzing Market...',
    },
    'Traditional Chinese': {
      analyzing: '分析中...',
      loading: '載入中...',
      analyzingMarket: '分析市場中...',
    },
    'Simplified Chinese': {
      analyzing: '分析中...',
      loading: '加载中...',
      analyzingMarket: '分析市场中...',
    },
  };

  // During SSR, provide default context
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'English', setLanguage: handleSetLanguage, t: translations['English'] }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}