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

  // Header topics - Row 1
  const headerTopicsRow1 = [
    { id: 'analysis', label: 'AI 分析', icon: '📊' },
    { id: 'about', label: '關於我們', icon: '👥' },
  ];

  // Header topics - Row 2
  const headerTopicsRow2 = [
    { id: 'features', label: '功能介紹', icon: '⚙️' },
    { id: 'pricing', label: '服務定價', icon: '💰' },
  ];

  // Footer topics (hidden in 3-line menu)
  const footerTopics = [
    { id: 'DISCLAIMER', label: '免責聲明' },
    { id: '服務條款', label: '服務條款' },
    { id: '隱私政策', label: '隱私政策' },
    { id: '退款政策', label: '退款政策' },
    { id: '聯絡我們', label: '聯絡我們' },
  ];

  const handleNavigate = (page: string, topicId?: string) => {
    if (page === 'analysis') {
      onNavigate('analysis', { topic: topicId });
    } else {
      onNavigate('content', { view: topicId });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white" style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* RESTRICTED AREA 1: TOP HEADER */}
      <div className="bg-white pt-6 pb-2 px-4 flex-shrink-0">
        {/* Logo Row */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black italic text-red-600">
            vibeAiLink
          </h1>
          <div className="flex gap-2">
            <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
            <button 
              onClick={onAuthOpen}
              className="text-blue-600 font-semibold text-sm"
            >
              {user ? 'Welcome' : '登入'}
            </button>
          </div>
        </div>
        
        {/* Header Topics - Row 1 */}
        <div className="flex justify-around mb-2">
          {headerTopicsRow1.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleNavigate(topic.id, topic.id)}
              className="flex flex-col items-center gap-1 py-2"
            >
              <span className="text-2xl">{topic.icon}</span>
              <span className="text-xs font-medium text-gray-600">{topic.label}</span>
            </button>
          ))}
        </div>
        
        {/* Header Topics - Row 2 */}
        <div className="flex justify-around">
          {headerTopicsRow2.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleNavigate(topic.id, topic.id)}
              className="flex flex-col items-center gap-1 py-2"
            >
              <span className="text-2xl">{topic.icon}</span>
              <span className="text-xs font-medium text-gray-600">{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RESTRICTED AREA 2: MAIN CONTENT - Avatar / Golden Star */}
      <div className="flex-1 bg-[#FEF08A] flex flex-col items-center justify-center p-6" style={{ minHeight: 0 }}>
        {/* BIG Golden Star Button to navigate to analysis */}
        <button
          onClick={() => handleNavigate('analysis', 'analysis')}
          className="w-32 h-32 rounded-full bg-yellow-400 shadow-lg flex flex-col items-center justify-center hover:bg-yellow-500 transition transform active:scale-95"
        >
          <span className="text-5xl mb-2">⭐</span>
          <span className="text-sm font-bold text-gray-800">開始分析</span>
        </button>
        
        {/* Avatar Image */}
        <div className="mt-8 text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 bg-white shadow-md">
            <img 
              src="/avatars/michael_teresa.jpg" 
              className="w-full h-full object-cover" 
              alt="Michael & Teresa"
            />
          </div>
          <h3 className="font-bold text-gray-800">Michael & Teresa</h3>
          <p className="text-xs text-gray-600 mt-1">金融與市場分析</p>
        </div>
      </div>

      {/* RESTRICTED AREA 4: FOOTER - 3 lines icon */}
      <div className="bg-white py-3 px-6 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button
          onClick={() => setShowFooterMenu(!showFooterMenu)}
          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Footer Menu Popup */}
      {showFooterMenu && (
        <div className="fixed bottom-16 right-4 bg-white rounded-xl shadow-xl border border-gray-200 z-50 w-48">
          {footerTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setShowFooterMenu(false);
                handleNavigate('content', topic.id);
              }}
              className="w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 border-b border-gray-100 last:border-0"
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