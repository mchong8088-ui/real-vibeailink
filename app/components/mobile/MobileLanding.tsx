"use client";
import React from 'react';
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
  const t = {
    title: langKey === 'Cantonese' ? 'vibeAiLink' : langKey === '简体中文' ? 'vibeAiLink' : 'vibeAiLink',
    startAnalysis: langKey === 'Cantonese' ? '開始分析' : langKey === '简体中文' ? '开始分析' : 'Start Analysis',
    aboutUs: langKey === 'Cantonese' ? '關於我們' : langKey === '简体中文' ? '关于我们' : 'About Us',
    features: langKey === 'Cantonese' ? '功能介紹' : langKey === '简体中文' ? '功能介绍' : 'Features',
    pricing: langKey === 'Cantonese' ? '服務定價' : langKey === '简体中文' ? '服务定价' : 'Pricing',
    welcome: langKey === 'Cantonese' ? '歡迎' : langKey === '简体中文' ? '欢迎' : 'Welcome',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      backgroundColor: '#FEF08A',
      overflow: 'hidden'
    }}>
      
      {/* Top Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button
            onClick={onAuthOpen}
            style={{
              color: '#2563EB',
              fontWeight: '600',
              fontSize: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {user ? t.welcome : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}>
        
        {/* Large Rounded Image */}
        <div style={{
          width: '180px',
          height: '180px',
          borderRadius: '30px',
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          marginBottom: '24px'
        }}>
          <img
            src="/avatars/michael_teresa.jpg"
            alt="Michael & Teresa"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Bigger Wording Below */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1F2937',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          Michael & Teresa
        </h2>
        
        <p style={{
          fontSize: '14px',
          color: '#2563EB',
          fontWeight: '600',
          margin: '0 0 4px 0',
          textAlign: 'center'
        }}>
          {langKey === 'Cantonese' ? '金融與市場分析' : langKey === '简体中文' ? '金融与市场分析' : 'Finance & Market Analysis'}
        </p>
        
        <p style={{
          fontSize: '13px',
          color: '#6B7280',
          margin: '0 0 32px 0',
          textAlign: 'center',
          lineHeight: 1.4,
          padding: '0 20px'
        }}>
          {langKey === 'Cantonese' ? '我哋係 Michael 同 Teresa，金融專員同數據分析助手。' : 
           langKey === '简体中文' ? '我们是 Michael 和 Teresa，金融专员和数据分析助手。' : 
           'We are Michael and Teresa, finance specialist and data analysis assistant.'}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '280px'
        }}>
          <button
            onClick={() => onNavigate('analysis')}
            style={{
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {t.startAnalysis}
          </button>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => onNavigate('content', { view: 'about' })}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '40px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.aboutUs}
            </button>
            <button
              onClick={() => onNavigate('content', { view: 'features' })}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '40px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.features}
            </button>
            <button
              onClick={() => onNavigate('content', { view: 'pricing' })}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '40px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.pricing}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLanding;
