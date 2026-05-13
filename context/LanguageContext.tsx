'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'English' | 'Cantonese' | '简体中文';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  English: {
    'welcome': 'Welcome',
    'analyze': 'Analyze',
    'portfolio': 'Portfolio',
    'settings': 'Settings',
    'login': 'Login',
    'signup': 'Sign Up',
    'logout': 'Logout',
    'dashboard': 'Dashboard',
    'stockAnalysis': 'Stock Analysis',
    'enterSymbol': 'Enter stock symbol...',
    'analyzeButton': 'Analyze Stock',
    'loading': 'Loading...',
    'error': 'Error occurred',
    'retry': 'Retry',
  },
  Cantonese: {
    'welcome': '歡迎',
    'analyze': '分析',
    'portfolio': '投資組合',
    'settings': '設定',
    'login': '登入',
    'signup': '註冊',
    'logout': '登出',
    'dashboard': '儀表板',
    'stockAnalysis': '股票分析',
    'enterSymbol': '輸入股票代號...',
    'analyzeButton': '分析股票',
    'loading': '載入中...',
    'error': '發生錯誤',
    'retry': '再試一次',
  },
  '简体中文': {
    'welcome': '欢迎',
    'analyze': '分析',
    'portfolio': '投资组合',
    'settings': '设置',
    'login': '登录',
    'signup': '注册',
    'logout': '退出',
    'dashboard': '仪表板',
    'stockAnalysis': '股票分析',
    'enterSymbol': '输入股票代码...',
    'analyzeButton': '分析股票',
    'loading': '加载中...',
    'error': '发生错误',
    'retry': '重试',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'English' || saved === 'Cantonese' || saved === '简体中文')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.English[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
