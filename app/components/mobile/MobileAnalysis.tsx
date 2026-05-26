"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { SourceMenu } from '../features/controls/SourceMenu';
import { AboutSection } from '../sections/AboutSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PricingModal } from '../features/pricing/PricingModal';
import { StockAnalysisModule } from '../features/stock-analysis/StockAnalysisModule';
import { footerContent } from '../../constants/content';
import { speakText, stopSpeaking, isVoiceReady } from '../../utils/SimpleTTS';

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
  const [voicesReady, setVoicesReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const t = {
    analyzingMarket: langKey === 'Cantonese' ? '分析市場中...' : langKey === '简体中文' ? '分析市场中...' : 'Analyzing Market...',
  };

  // Check voice readiness
  useEffect(() => {
    const checkReady = () => {
      if (isVoiceReady()) {
        setVoicesReady(true);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }, []);

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

  // Handle speakTexter toggle
  const handleSpeakerToggle = () => {
    if (isSpeakerActive) {
      stopSpeaking();
      setIsSpeakerActive(false);
    } else if (analysisData?.summary && voicesReady) {
      setIsSpeakerActive(true);
      speakText(analysisData.summary, langKey, () => setIsSpeakerActive(false));
    }
    setIsPaused(false);
  };

  const handlePauseToggle = () => {
    if (!isPaused && isSpeakerActive) {
      stopSpeaking();
      setIsPaused(true);
    } else if (isPaused && isSpeakerActive && analysisData?.summary) {
      speakText(analysisData.summary, langKey);
      setIsPaused(false);
    }
  };

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
        marketCap: data.marketCap || "N/A",
        peRatio: data.peRatio || "N/A",
        volume: data.volume || "N/A",
        historical: data.historical || [],
        change: data.change,
        changePercent: data.changePercent,
      });
    } catch (error) {
      console.error('Error:', error);
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: langKey === 'Cantonese' ? `無法獲取 ${inputValue.trim().toUpperCase()} 的分析。請稍後再試。` : `Unable to fetch analysis for ${inputValue.trim().toUpperCase()}. Please try again.`,
        price: "N/A",
        rsi: "N/A",
        macd: "N/A",
        marketCap: "N/A",
        peRatio: "N/A",
        volume: "N/A",
        historical: [],
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

  const handleSelectPlan = async (planId: string, priceId: string) => {
    console.log('Selected plan:', planId, priceId);
  };

  const handleSourceSelect = (sourceType: string, sourceData?: any) => {
    if (sourceType === 'url' && sourceData) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceData, language: langKey }),
      }).then(response => response.json())
        .then(data => {
          setAnalysisData((prev: any) => ({
            ...prev,
            summary: prev?.summary + "\n\n📎 URL Analysis:\n" + (data.text || "URL analysis completed.")
          }));
        });
    }
    setIsMenuOpen(false);
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

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh',
      width: '100%', 
      backgroundColor: '#f5f5f5', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '8px 12px', 
        borderBottom: '1px solid #E5E7EB', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexShrink: 0,
        zIndex: 10
      }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: '500' }}>Back</span>
        </button>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      <div style={{ 
        flex: '0 1 auto',
        overflowY: 'auto', 
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: '4px 8px 2px 8px',
        backgroundColor: '#F9FAFB',
        minHeight: 0,
        maxHeight: 'calc(100dvh - 130px)'
      }}>
        
        {legalTitle && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '8px', marginBottom: '6px' }}>
            <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: 1.4 }}>
              {footerContent[legalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}
            </div>
          </div>
        )}

        {topicId === 'pricing' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '8px', marginBottom: '6px' }}>
            <PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />
          </div>
        )}

        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}

        {isAnalysisMode && !legalTitle && (
          <StockAnalysisModule 
            t={t}
            data={analysisData} 
            isLoading={isLoading} 
            langKey={langKey}
          />
        )}
      </div>

      {isAnalysisMode && !legalTitle && (
        <div style={{ 
          backgroundColor: 'white', 
          borderTop: '1px solid #E5E7EB', 
          padding: '6px 10px', 
          paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
            <button onClick={() => setIsMenuOpen(true)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>
              +
            </button>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={exampleText} onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()} style={{ flex: 1, padding: '6px 10px', fontSize: '12px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '16px', border: '1px solid #E5E7EB', outline: 'none', minWidth: 0 }} />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={handleMicToggle} style={{ width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isListening ? '#3B82F6' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button onClick={handleSpeakerToggle} style={{ width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSpeakerActive ? '#EF4444' : '#9CA3AF', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            <button onClick={handlePauseToggle} style={{ width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isPaused ? '#9CA3AF' : '#EF4444', color: 'white', border: 'none', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button onClick={handleAnalyze} disabled={!inputValue.trim()} style={{ width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: inputValue.trim() ? '#22C55E' : '#D1D5DB', color: 'white', border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M17 7L7 17" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={langKey} />
    </div>
  );
};

export default MobileAnalysis;
