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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: 'white', overflow: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ backgroundColor: 'white', padding: '12px 16px 8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '14px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
            <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}>
              {user ? 'Welcome' : '登入'}
            </button>
          </div>
        </div>
        
        {/* Header Topics */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px' }}>
          {headerTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleNavigate(topic.id, topic.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '20px' }}>{topic.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: '500', color: '#4B5563' }}>{topic.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Yellow background */}
      <div style={{ flex: 1, backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        {/* Avatar - 56px (slightly larger but still contained) */}
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '8px' }}>
          <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Teresa" />
        </div>
        
        <h3 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '11px', margin: '4px 0 0 0' }}>Michael & Teresa</h3>
        <p style={{ fontSize: '9px', color: '#4B5563', margin: '2px 0 0 0' }}>金融與市場分析</p>
        
        {/* Welcome Message */}
        <p style={{ fontSize: '10px', color: '#374151', textAlign: 'center', marginTop: '12px', padding: '0 8px', lineHeight: '1.4' }}>
          我哋係 Michael 同 Teresa，金融專員同數據分析助手。
        </p>
        
        {/* Start Button */}
        <button
          onClick={() => handleNavigate('analysis', 'analysis')}
          style={{ marginTop: '16px', padding: '8px 20px', backgroundColor: '#FBBF24', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '14px' }}>⭐</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1F2937' }}>開始分析</span>
        </button>
      </div>

      {/* Footer - 3-line icon */}
      <div style={{ backgroundColor: 'white', padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button
          onClick={() => setShowFooterMenu(!showFooterMenu)}
          style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>

      {/* Footer Popup Menu */}
      {showFooterMenu && (
        <div style={{ position: 'fixed', bottom: '48px', right: '12px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', zIndex: 50, width: '160px' }}>
          {footerTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleFooterSelect(topic.id)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#2563EB', background: 'none', border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
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