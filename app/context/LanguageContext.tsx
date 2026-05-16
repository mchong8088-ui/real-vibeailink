'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'English' | 'Cantonese' | '简体中文';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  English: {
    // Header Navigation
    'aiStock': 'AI Stock',
    'about': 'ABOUT',
    'features': 'FEATURES',
    'pricing': 'PRICING',
    'login': 'Login',
    
    // Left Panel
    'financeMarketAnalysis': 'FINANCE & MARKET ANALYSIS',
    'environmentActive': 'Environment Active',
    
    // Footer
    'disclaimer': 'Disclaimer',
    'termsOfService': 'Terms of Service',
    'privacyPolicy': 'Privacy Policy',
    'refundPolicy': 'Refund Policy',
    'contactUs': 'Contact Us',
    
    // Basic UI
    'welcome': 'Welcome',
    'analyze': 'Analyze',
    'portfolio': 'Portfolio',
    'settings': 'Settings',
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
    // Header Navigation
    'aiStock': 'AI 股票',
    'about': '關於我們',
    'features': '功能介紹',
    'pricing': '服務定價',
    'login': '登入',
    
    // Left Panel
    'financeMarketAnalysis': '金融及市場分析',
    'environmentActive': '環境運行中',
    
    // Footer
    'disclaimer': '免責聲明',
    'termsOfService': '服務條款',
    'privacyPolicy': '隱私政策',
    'refundPolicy': '退款政策',
    'contactUs': '聯絡我們',
    
    // Basic UI
    'welcome': '歡迎',
    'analyze': '分析',
    'portfolio': '投資組合',
    'settings': '設定',
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
    // Header Navigation
    'aiStock': 'AI 股票',
    'about': '关于我们',
    'features': '功能介绍',
    'pricing': '服务定价',
    'login': '登录',
    
    // Left Panel
    'financeMarketAnalysis': '金融及市场分析',
    'environmentActive': '环境运行中',
    
    // Footer
    'disclaimer': '免责声明',
    'termsOfService': '服务条款',
    'privacyPolicy': '隐私政策',
    'refundPolicy': '退款政策',
    'contactUs': '联系我们',
    
    // Basic UI
    'welcome': '欢迎',
    'analyze': '分析',
    'portfolio': '投资组合',
    'settings': '设置',
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