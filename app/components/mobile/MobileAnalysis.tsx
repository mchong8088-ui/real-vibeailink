"use client";
import React from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { initTTS } from '../../utils/ttsMaster';
import { VoiceSelector } from '../layout/VoiceSelector';

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
  const [showFooterMenu, setShowFooterMenu] = React.useState(false);
  const [voiceLanguage, setVoiceLanguage] = React.useState<string>('English');

  // Load voice preference from localStorage
  React.useEffect(() => {
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice === 'Cantonese' || savedVoice === 'Mandarin' || savedVoice === 'Taiwanese' || savedVoice === 'English') {
      setVoiceLanguage(savedVoice);
    } else {
      setVoiceLanguage('English');
    }
  }, []);

  // Initialize TTS on mount
  React.useEffect(() => {
    initTTS();
  }, []);

  const getTranslatedText = () => {
    if (langKey === 'Traditional Chinese') {
      return {
        startAnalysis: '開始分析',
        aboutUs: '關於',
        features: '功能',
        pricing: '定價',
        disclaimer: '免責聲明',
        terms: '服務條款',
        privacy: '隱私政策',
        refund: '退款政策',
        contact: '聯絡我們',
        welcome: '歡迎',
        financeText: '金融與市場分析',
        description: '我哋係 Michael 同 Teresa，金融專員同數據分析助手。'
      };
    } else if (langKey === 'Simplified Chinese') {
      return {
        startAnalysis: '开始分析',
        aboutUs: '关于',
        features: '功能',
        pricing: '定价',
        disclaimer: '免责声明',
        terms: '服务条款',
        privacy: '隐私政策',
        refund: '退款政策',
        contact: '联系我们',
        welcome: '欢迎',
        financeText: '金融与市场分析',
        description: '我们是 Michael 和 Teresa，金融专员和数据分析助手。'
      };
    } else {
      return {
        startAnalysis: 'Start Analysis',
        aboutUs: 'About',
        features: 'Features',
        pricing: 'Pricing',
        disclaimer: 'Disclaimer',
        terms: 'Terms',
        privacy: 'Privacy',
        refund: 'Refund',
        contact: 'Contact',
        welcome: 'Welcome',
        financeText: 'Finance & Market Analysis',
        description: 'We are Michael and Teresa, finance specialist and data analysis assistant.'
      };
    }
  };

  const t = getTranslatedText();

  const footerItems = [
    { label: t.disclaimer, key: 'DISCLAIMER' },
    { label: t.terms, key: '服務條款' },
    { label: t.privacy, key: '隱私政策' },
    { label: t.refund, key: '退款政策' },
    { label: t.contact, key: '聯絡我們' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      backgroundColor: '#FEF08A',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Top Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '8px'
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0, flexShrink: 0 }}>vibeAiLink</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <VoiceSelector 
            currentVoice={voiceLanguage}
            onVoiceChange={setVoiceLanguage}
          />
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button
            onClick={onAuthOpen}
            style={{
              color: '#2563EB',
              fontWeight: '600',
              fontSize: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {user ? t.welcome : (langKey === 'Traditional Chinese' ? '登入' : langKey === 'Simplified Chinese' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}>
        
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
          {t.financeText}
        </p>
        
        <p style={{
          fontSize: '13px',
          color: '#6B7280',
          margin: '0 0 32px 0',
          textAlign: 'center',
          lineHeight: 1.4,
          padding: '0 20px'
        }}>
          {t.description}
        </p>

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
            }}
          >
            {t.startAnalysis}
          </button>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'nowrap'
          }}>
            <button
              onClick={() => onNavigate('content', { view: 'about' })}
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '40px',
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 0
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
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 0
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
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 0
              }}
            >
              {t.pricing}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Menu Button */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 30
      }}>
        <button
          onClick={() => setShowFooterMenu(!showFooterMenu)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {showFooterMenu && (
          <div style={{
            position: 'absolute',
            bottom: '56px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '140px',
            overflow: 'hidden'
          }}>
            {footerItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  onNavigate('content', { view: item.key });
                  setShowFooterMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  backgroundColor: 'white',
                  border: 'none',
                  borderBottom: index < footerItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#4B5563',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileLanding;