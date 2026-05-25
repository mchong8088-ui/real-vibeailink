// components/mobile/MobileAnalysis.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { AboutSection } from '../sections/AboutSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PricingModal } from '../features/pricing/PricingModal';
import { footerContent } from '../../constants/content';

interface MobileAnalysisProps {
  langKey: string;
  setLangKey: (lang: string) => void;
  user: any;
  onAuthOpen: () => void;
  viewType: string;
  topicId?: string;
  legalTitle?: string | null;
  onBack: () => void;
}

const MobileAnalysis: React.FC<MobileAnalysisProps> = ({
  langKey,
  setLangKey,
  user,
  onAuthOpen,
  viewType,
  topicId,
  legalTitle,
  onBack,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const t = {
    analyzingMarket: langKey === 'Cantonese' ? '分析市場中...' : langKey === '简体中文' ? '分析市场中...' : 'Analyzing Market...',
  };

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          setInputValue(event.results[0][0].transcript);
          setIsListening(false);
        };
        
        recognitionInstance.onerror = () => setIsListening(false);
        recognitionInstance.onend = () => setIsListening(false);
        setRecognition(recognitionInstance);
      }
    }
  }, [langKey]);

  // Text-to-Speech
  useEffect(() => {
    if (analysisData?.summary && isSpeakerActive && !isPaused) {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(analysisData.summary);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => { utteranceRef.current = null; };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    return () => { if (utteranceRef.current) window.speechSynthesis.cancel(); };
  }, [analysisData?.summary, isSpeakerActive, langKey]);

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputValue.trim(),
          language: langKey,
        }),
      });
      const data = await response.json();
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: data.text || data.summary || `Analysis for ${inputValue.trim().toUpperCase()} completed.`,
        price: data.price || "N/A",
        rsi: data.rsi || "N/A",
        macd: data.macd || "N/A",
      });
    } catch (error) {
      console.error('Error:', error);
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: langKey === 'Cantonese' ? `無法獲取 ${inputValue.trim().toUpperCase()} 的分析。請稍後再試。` : `Unable to fetch analysis for ${inputValue.trim().toUpperCase()}. Please try again.`,
        price: "N/A",
        rsi: "N/A",
        macd: "N/A",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    } else if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
  };

  const handleSpeakerToggle = () => {
    if (isSpeakerActive && utteranceRef.current) {
      window.speechSynthesis.cancel();
    } else if (!isSpeakerActive && analysisData?.summary) {
      const utterance = new SpeechSynthesisUtterance(analysisData.summary);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    setIsSpeakerActive(!isSpeakerActive);
    setIsPaused(false);
  };

  const handlePauseToggle = () => {
    if (!isPaused && isSpeakerActive) {
      window.speechSynthesis.cancel();
      setIsPaused(true);
    } else if (isPaused && isSpeakerActive && analysisData?.summary) {
      const utterance = new SpeechSynthesisUtterance(analysisData.summary);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPaused(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    console.log('Selected plan:', planId, priceId);
  };

  const exampleText = langKey === 'Cantonese' ? '輸入股票代號 e.g.: 0700.hk, TSLA' : langKey === '简体中文' ? '输入股票代码 e.g.: 0700.hk, TSLA' : 'Enter stock symbol e.g.: 0700.hk, TSLA';
  const isAnalysisMode = viewType === 'analysis';

  const getTitle = () => {
    if (legalTitle) return legalTitle;
    if (topicId === 'about') return langKey === 'Cantonese' ? '關於我們' : langKey === '简体中文' ? '关于我们' : 'About';
    if (topicId === 'features') return langKey === 'Cantonese' ? '功能介紹' : langKey === '简体中文' ? '功能介绍' : 'Features';
    if (topicId === 'pricing') return langKey === 'Cantonese' ? '服務定價' : langKey === '简体中文' ? '服务定价' : 'Pricing';
    return langKey === 'Cantonese' ? 'AI 分析' : langKey === '简体中文' ? 'AI 分析' : 'AI Analysis';
  };

  // Professional Input Menu
  const ProfessionalInputMenu = () => (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Professional Input</span>
          <button onClick={() => setShowSourceMenu(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>
        <button
          onClick={() => {
            setShowSourceMenu(false);
            const url = prompt('Enter URL to analyze:');
            if (url) {
              fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, language: langKey }),
              }).then(response => response.json())
                .then(data => {
                  setAnalysisData(prev => ({
                    ...prev,
                    summary: prev?.summary + "\n\n📎 " + (data.text || "URL analysis completed.")
                  }));
                });
            }
          }}
          style={{ width: '100%', padding: '10px', textAlign: 'left', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
        >
          🔗 Enter URL
        </button>
        <button
          onClick={() => {
            setShowSourceMenu(false);
            alert('File upload feature coming soon');
          }}
          style={{ width: '100%', padding: '10px', textAlign: 'left', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
        >
          📄 Upload File
        </button>
        <button
          onClick={() => {
            setShowSourceMenu(false);
            alert('Camera feature coming soon');
          }}
          style={{ width: '100%', padding: '10px', textAlign: 'left', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          📷 Take Photo
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100%', 
      backgroundColor: '#f5f5f5', 
      overflow: 'hidden' 
    }}>
      
      {/* TOP BAR - Fixed */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '12px 16px', 
        borderBottom: '1px solid #E5E7EB', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexShrink: 0 
      }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      {/* OUTPUT AREA - Takes all available space, scrollable */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '12px',
        backgroundColor: '#F9FAFB'
      }}>
        
        {legalTitle && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#4B5563' }}>
              {footerContent[legalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}
            </div>
          </div>
        )}

        {topicId === 'pricing' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px' }}>
            <PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />
          </div>
        )}

        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}

        {isAnalysisMode && !legalTitle && (
          <>
            {isLoading ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: '28px', height: '28px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>{t.analyzingMarket}</p>
              </div>
            ) : !analysisData || !analysisData.symbol ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>{langKey === 'Cantonese' ? '請輸入股票代號' : 'Please enter stock symbol'}</p>
              </div>
            ) : (
              <>
                {/* Stock Symbol Header */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', textAlign: 'center' }}>{analysisData.symbol}</h2>
                </div>
                
                {/* Quick Stats Row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>{langKey === 'Cantonese' ? '價格' : 'Price'}</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>{analysisData.price}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>RSI</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6' }}>{analysisData.rsi}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>MACD</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981' }}>{analysisData.macd}</p>
                  </div>
                </div>
                
                {/* Analysis Text - Takes full width */}
                {analysisData.summary && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{analysisData.summary}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* FIXED INPUT BAR - Always at bottom, like WhatsApp */}
      {isAnalysisMode && !legalTitle && (
        <div style={{ 
          backgroundColor: 'white', 
          borderTop: '1px solid #E5E7EB', 
          padding: '8px 12px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          flexShrink: 0 
        }}>
          {/* Input Row with + button on left */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* RED Plus Button */}
            <button
              onClick={() => setShowSourceMenu(!showSourceMenu)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              +
            </button>
            
            {/* Input Field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? (langKey === 'Cantonese' ? '聆聽中...' : 'Listening...') : exampleText}
              style={{ 
                flex: 1, 
                padding: '10px 12px', 
                fontSize: '14px', 
                color: '#1F2937', 
                backgroundColor: '#F3F4F6', 
                borderRadius: '20px', 
                border: '1px solid #E5E7EB', 
                outline: 'none',
                minWidth: 0
              }}
            />
          </div>
          
          {/* Control Buttons Row - Square icons like WhatsApp */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'space-around' }}>
            {/* MIC Button - Red Square */}
            <button
              onClick={handleMicToggle}
              style={{ 
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isListening ? '#3B82F6' : '#EF4444', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Speaker Button - Red Square */}
            <button
              onClick={handleSpeakerToggle}
              style={{ 
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSpeakerActive ? '#EF4444' : '#9CA3AF', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {/* Pause Button - Red Square */}
            <button
              onClick={handlePauseToggle}
              style={{ 
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isPaused ? '#9CA3AF' : '#EF4444', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Send Button - Green Square */}
            <button
              onClick={handleAnalyze}
              disabled={!inputValue.trim()}
              style={{ 
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: inputValue.trim() ? '#22C55E' : '#D1D5DB', 
                color: 'white', 
                border: 'none', 
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M17 7L7 17" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Professional Input Menu Popup */}
      {showSourceMenu && <ProfessionalInputMenu />}
    </div>
  );
};

export default MobileAnalysis;