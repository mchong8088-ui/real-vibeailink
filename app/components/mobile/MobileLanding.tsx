// components/mobile/MobileLanding.tsx
"use client";
import React, { useState } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';

interface MobileLandingProps {
  langKey: string;
  setLangKey: (lang: string) => void;
  onAuthOpen: () => void;
  user: any;
  onNavigate: (page: string, params?: any) => void;
}

const MobileLanding: React.FC<MobileLandingProps> = ({
  langKey,
  setLangKey,
  onAuthOpen,
  user,
  onNavigate,
}) => {
  const [showFooterMenu, setShowFooterMenu] = useState(false);

  const headerTopics = [
    { id: 'analysis', label: 'AI分析', icon: '📊' },
    { id: 'about', label: '關於', icon: '👥' },
    { id: 'features', label: '功能', icon: '⚙️' },
    { id: 'pricing', label: '定價', icon: '💰' },
  ];

  const footerTopics = [
    { id: 'DISCLAIMER', label: '免責聲明' },
    { id: '服務條款', label: '服務條款' },
    { id: '隱私政策', label: '隱私政策' },
    { id: '退款政策', label: '退款政策' },
    { id: '聯絡我們', label: '聯絡我們' },
  ];

  const handleNavigate = (page: string, topicId?: string) => {
    if (page === 'analysis') {
      onNavigate('analysis', { view: 'analysis' });
    } else {
      onNavigate('content', { view: topicId });
    }
  };

  const handleFooterSelect = (topicId: string) => {
    setShowFooterMenu(false);
    onNavigate('content', { view: topicId });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      
      {/* Page 1: Landing Page */}
      
      {/* RESTRICTED REGION 1: Top Header */}
      <div className="bg-white pt-3 pb-2 px-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-black italic text-red-600">vibeAiLink</h1>
          <div className="flex gap-3 items-center">
            <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
            <button onClick={onAuthOpen} className="text-blue-600 font-semibold text-sm">
              {user ? 'Welcome' : '登入'}
            </button>
          </div>
        </div>
        
        {/* Header Topics - 4 items */}
        <div className="flex justify-around mt-3">
          {headerTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleNavigate(topic.id, topic.id)}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <span className="text-xl">{topic.icon}</span>
              <span className="text-[10px] font-medium text-gray-600">{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RESTRICTED REGION 2: Main Content with Welcome Message */}
      <div className="flex-1 bg-[#FEF08A] flex flex-col items-center justify-center px-4 py-2">
        {/* Small Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white shadow-md">
          <img src="/avatars/michael_teresa.jpg" className="w-full h-full object-cover" alt="Michael & Teresa" />
        </div>
        
        <h3 className="font-bold text-gray-800 text-sm mt-1">Michael & Teresa</h3>
        <p className="text-[9px] text-gray-600">金融與市場分析</p>
        
        {/* Welcome Message */}
        <p className="text-[10px] text-gray-700 text-center mt-3 px-4 leading-relaxed">
          Hi，我哋係 Michael 同 Teresa，金融專員同數據分析助手。<br />
          歡迎一齊探索全球 AI 新聞同股票分析。
        </p>
        
        {/* Start Button - Navigates to Page 2 */}
        <button
          onClick={() => handleNavigate('analysis', 'analysis')}
          className="mt-4 px-6 py-2 bg-yellow-400 rounded-full shadow-md flex items-center gap-2 active:scale-95"
        >
          <span className="text-lg">⭐</span>
          <span className="text-sm font-bold text-gray-800">開始分析</span>
        </button>
      </div>

      {/* RESTRICTED REGION 4: Footer - 3-line icon only */}
      <div className="bg-white py-2 px-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button
          onClick={() => setShowFooterMenu(!showFooterMenu)}
          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Footer Popup Menu */}
      {showFooterMenu && (
        <div className="fixed bottom-14 right-3 bg-white rounded-xl shadow-xl border z-50 w-40">
          {footerTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleFooterSelect(topic.id)}
              className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              {topic.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileLanding;