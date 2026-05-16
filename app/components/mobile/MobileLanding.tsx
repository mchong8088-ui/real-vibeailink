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
    { id: 'analysis', label: langKey === 'Cantonese' ? 'AI 分析' : langKey === '简体中文' ? 'AI 分析' : 'AI Stock', icon: '📊' },
    { id: 'about', label: langKey === 'Cantonese' ? '關於我們' : langKey === '简体中文' ? '关于我们' : 'About', icon: '👥' },
  ];

  // Header topics - Row 2
  const headerTopicsRow2 = [
    { id: 'features', label: langKey === 'Cantonese' ? '功能介紹' : langKey === '简体中文' ? '功能介绍' : 'Features', icon: '⚙️' },
    { id: 'pricing', label: langKey === 'Cantonese' ? '服務定價' : langKey === '简体中文' ? '服务定价' : 'Pricing', icon: '💰' },
  ];

  // Footer topics (hidden in 3-line menu)
  const footerTopics = [
    { id: 'DISCLAIMER', label: langKey === 'Cantonese' ? '免責聲明' : langKey === '简体中文' ? '免责声明' : 'Disclaimer' },
    { id: '服務條款', label: langKey === 'Cantonese' ? '服務條款' : langKey === '简体中文' ? '服务条款' : 'Terms of Service' },
    { id: '隱私政策', label: langKey === 'Cantonese' ? '隱私政策' : langKey === '简体中文' ? '隐私政策' : 'Privacy Policy' },
    { id: '退款政策', label: langKey === 'Cantonese' ? '退款政策' : langKey === '简体中文' ? '退款政策' : 'Refund Policy' },
    { id: '聯絡我們', label: langKey === 'Cantonese' ? '聯絡我們' : langKey === '简体中文' ? '联系我们' : 'Contact Us' },
  ];

  const welcomeMessage = langKey === 'Cantonese' 
    ? 'Hi，我哋係 Michael 同 Teresa，金融專員同數據分析助手。歡迎一齊探索全球 AI 新聞同股票分析。點擊感興趣嘅主題，開始旅程啦！'
    : langKey === '简体中文'
    ? 'Hi，我们是 Michael 和 Teresa，金融专员和数据分析助手。欢迎一起探索全球 AI 新闻和股票分析。点击感兴趣的主题，开始旅程吧！'
    : 'Hi, we are Michael and Teresa, Finance Specialist and Data Analysis assistant. Welcome to explore Global AI News and Stock Analysis. Click on the topics you are interested in to start the journey!';

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
              {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
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

      {/* RESTRICTED AREA 2: MAIN CONTENT - Avatar / Golden Star / Welcome Message */}
      <div className="flex-1 bg-[#FEF08A] flex flex-col items-center justify-center p-6 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Avatar Image */}
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-white shadow-md">
          <img 
            src="/avatars/michael_teresa.jpg" 
            className="w-full h-full object-cover" 
            alt="Michael & Teresa"
          />
        </div>
        
        <h3 className="font-bold text-gray-800 text-lg">Michael & Teresa</h3>
        <p className="text-xs text-gray-600 mt-1 mb-4">
          {langKey === 'Cantonese' ? '金融與市場分析' : langKey === '简体中文' ? '金融与市场分析' : 'Finance & Market Analysis'}
        </p>
        
        {/* Welcome Message */}
        <div className="bg-white/70 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-700 leading-relaxed">
            {welcomeMessage}
          </p>
        </div>
        
        {/* BIG Golden Star Button to navigate to analysis */}
        <button
          onClick={() => handleNavigate('analysis', 'analysis')}
          className="w-32 h-32 rounded-full bg-yellow-400 shadow-lg flex flex-col items-center justify-center hover:bg-yellow-500 transition transform active:scale-95"
        >
          <span className="text-5xl mb-2">⭐</span>
          <span className="text-sm font-bold text-gray-800">
            {langKey === 'Cantonese' ? '開始分析' : langKey === '简体中文' ? '开始分析' : 'Start Analysis'}
          </span>
        </button>
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
              onClick={() => handleFooterSelect(topic.id)}
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