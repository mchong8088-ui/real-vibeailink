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

  const CompactAnalysis = () => {
    if (isLoading) {
      return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }}></div>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>{t.analyzingMarket}</p>
        </div>
      );
    }

    if (!analysisData || !analysisData.symbol) {
      return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>{langKey === 'Cantonese' ? '請輸入股票代號' : 'Please enter stock symbol'}</p>
          <p style={{ color: '#D1D5DB', fontSize: '11px', marginTop: '4px' }}>e.g.: 0700.hk, TSLA</p>
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>{analysisData.symbol}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '9px', color: '#9CA3AF' }}>{langKey === 'Cantonese' ? '價格' : 'Price'}</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>{analysisData.price}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '9px', color: '#9CA3AF' }}>RSI</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563EB' }}>{analysisData.rsi}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '9px', color: '#9CA3AF' }}>MACD</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>{analysisData.macd}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: 'white', overflow: 'hidden' }}>
      
      {/* TOP BAR - Return Arrow with text, Title, Language/Login in one row */}
      <div style={{ backgroundColor: 'white', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Back</span>
        </button>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      {/* SCROLLABLE MEAT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', padding: '12px' }}>
        
        {legalTitle && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
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
            <CompactAnalysis />
            {analysisData?.summary && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginTop: '12px', maxHeight: '160px', overflowY: 'auto' }}>
                <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{analysisData.summary}</p>
              </div>
            )}
            <div style={{ height: '80px' }}></div>
          </>
        )}
      </div>

      {/* FIXED INPUT BAR - Bottom of screen */}
      {isAnalysisMode && !legalTitle && (
        <div style={{ backgroundColor: 'white', borderTop: '1px solid #E5E7EB', padding: '12px', flexShrink: 0 }}>
          {/* Input Field - Full width */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? (langKey === 'Cantonese' ? '聆聽中...' : 'Listening...') : exampleText}
            style={{ width: '100%', padding: '12px', fontSize: '14px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', marginBottom: '12px' }}
          />
          
          {/* Control Buttons Row - 4 buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* MIC Button */}
            <button
              onClick={handleMicToggle}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: isListening ? '#3B82F6' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span style={{ fontSize: '11px' }}>MIC</span>
            </button>

            {/* Speaker Button */}
            <button
              onClick={handleSpeakerToggle}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: isSpeakerActive ? '#EF4444' : '#9CA3AF', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span style={{ fontSize: '11px' }}>Speaker</span>
            </button>

            {/* Pause Button */}
            <button
              onClick={handlePauseToggle}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: isPaused ? '#9CA3AF' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '11px' }}>Pause</span>
            </button>

            {/* Send Button */}
            <button
              onClick={handleAnalyze}
              disabled={!inputValue.trim()}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: inputValue.trim() ? '#22C55E' : '#D1D5DB', color: 'white', border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M17 7L7 17" />
              </svg>
              <span style={{ fontSize: '11px' }}>Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAnalysis;