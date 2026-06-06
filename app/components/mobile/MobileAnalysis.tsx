"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { SourceMenu } from '../features/controls/SourceMenu';
import { AboutSection } from '../sections/AboutSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PricingModal } from '../features/pricing/PricingModal';
import { StockAnalysisModule } from '../features/stock-analysis/StockAnalysisModule';
import { footerContent } from '../../constants/content';
import { speakText, stopSpeaking } from '../../utils/SimpleTTS';

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
  const [isSpeakerActive, setIsSpeakerActive] = useState(true); // Set to true by default
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [useAIEnhancement, setUseAIEnhancement] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const t = {
    analyzingMarket: langKey === 'Cantonese' ? '分析市場中...' : langKey === '简体中文' ? '分析市场中...' : 'Analyzing Market...',
  };

  // Convert text for better TTS pronunciation
  const prepareTextForTTS = (text: string): string => {
    let result = text;
    
    if (langKey === 'Cantonese') {
      result = result.replace(/##?\s*📊\s*/g, '');
      result = result.replace(/###\s*/g, '');
      result = result.replace(/\*\*/g, '');
      result = result.replace(/##/g, '');
      result = result.replace(/\*/g, '');
      result = result.replace(/HK\$(\d+\.?\d*)/g, '港幣$1元');
      result = result.replace(/NT\$(\d+\.?\d*)/g, '新台幣$1元');
      result = result.replace(/\$(\d+\.?\d*)/g, '美元$1元');
      result = result.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => `${num}個巴仙`);
      result = result.replace(/\+/g, '加');
      result = result.replace(/-/g, '減');
      result = result.replace(/\./g, '點');
      result = result.replace(/:/g, '係');
      result = result.replace(/\s+/g, ' ');
      result = result.trim();
    } else if (langKey === '简体中文') {
      result = result.replace(/##?\s*📊\s*/g, '');
      result = result.replace(/###\s*/g, '');
      result = result.replace(/\*\*/g, '');
      result = result.replace(/HK\$(\d+\.?\d*)/g, '港币$1元');
      result = result.replace(/NT\$(\d+\.?\d*)/g, '新台币$1元');
      result = result.replace(/\$(\d+\.?\d*)/g, '美元$1元');
      result = result.replace(/(\d+(?:\.\d+)?)%/g, '$1百分之');
    }
    
    return result;
  };

  // Auto-speak when analysis data arrives
  useEffect(() => {
    if (analysisData?.summary && isSpeakerActive && !isPaused) {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      const textToSpeak = prepareTextForTTS(analysisData.summary);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [analysisData, isSpeakerActive, isPaused, langKey]);

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

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    try {
      const endpoint = useAIEnhancement ? '/api/chat/ai-enhanced' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputValue.trim(), 
          language: langKey,
          useAI: useAIEnhancement
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
        companyName: data.companyName,
        currency: data.currency,
        sma20: data.sma20,
        sma50: data.sma50,
        volatility: data.volatility,
        avgVolume: data.avgVolume,
        dayLow: data.dayLow,
        dayHigh: data.dayHigh,
        specificAnalysis: data.specificAnalysis
      });
    } catch (error) {
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: `Unable to fetch analysis for ${inputValue.trim().toUpperCase()}. Please try again.`,
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

  const handleSpeakerToggle = () => {
    if (isSpeakerActive) {
      // Turn off speaker
      window.speechSynthesis.cancel();
      setIsSpeakerActive(false);
      setIsPaused(false);
    } else {
      // Turn on speaker and speak current analysis
      setIsSpeakerActive(true);
      setIsPaused(false);
      if (analysisData?.summary) {
        if (utteranceRef.current) {
          window.speechSynthesis.cancel();
        }
        const textToSpeak = prepareTextForTTS(analysisData.summary);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          utteranceRef.current = null;
        };
        utterance.onerror = () => {
          utteranceRef.current = null;
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handlePauseToggle = () => {
    if (!analysisData?.summary) return;
    
    if (isSpeakerActive && !isPaused) {
      // Pause speaking
      window.speechSynthesis.cancel();
      setIsPaused(true);
    } else if (isPaused && isSpeakerActive) {
      // Resume speaking
      const textToSpeak = prepareTextForTTS(analysisData.summary);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPaused(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    console.log('Selected plan:', planId, priceId);
  };

  const handleSourceSelect = (sourceType: string, sourceData?: any) => {
    if (sourceType === 'url' && sourceData) {
      const endpoint = useAIEnhancement ? '/api/chat/ai-enhanced' : '/api/chat';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: sourceData, 
          language: langKey,
          useAI: useAIEnhancement 
        }),
      }).then(response => response.json()).then(data => {
        setAnalysisData((prev: any) => ({ ...prev, summary: prev?.summary + "\n\n📎 URL Analysis:\n" + (data.text || "URL analysis completed.") }));
      });
    }
    setIsMenuOpen(false);
  };

  const exampleText = langKey === 'Cantonese' ? '輸入股票代號 e.g.: 0700.hk, 2330.tw, TSLA' : langKey === '简体中文' ? '输入股票代码 e.g.: 0700.hk, 2330.tw, TSLA' : 'Enter stock symbol e.g.: 0700.hk, 2330.tw, TSLA';
  const isAnalysisMode = viewType === 'analysis';

  const getTitle = () => {
    if (legalTitle) return legalTitle;
    if (topicId === 'about') return langKey === 'Cantonese' ? '關於我們' : langKey === '简体中文' ? '关于我们' : 'About';
    if (topicId === 'features') return langKey === 'Cantonese' ? '功能介紹' : langKey === '简体中文' ? '功能介绍' : 'Features';
    if (topicId === 'pricing') return langKey === 'Cantonese' ? '服務定價' : langKey === '简体中文' ? '服务定价' : 'Pricing';
    return langKey === 'Cantonese' ? 'AI 分析' : langKey === '简体中文' ? 'AI 分析' : 'AI Analysis';
  };

  const renderButtonWithCross = (isActive: boolean, onClick: () => void, icon: React.ReactElement, color: string, inactiveColor: string) => {
    const bgColor = isActive ? color : inactiveColor;
    return (
      <button onClick={onClick} style={{ flex: 1, height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, color: 'white', border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        {icon}
        {!isActive && (<div style={{ position: 'absolute', top: '50%', left: '50%', width: '2px', height: '30px', backgroundColor: 'white', transform: 'translate(-50%, -50%) rotate(45deg)', borderRadius: '1px' }} />)}
      </button>
    );
  };

  const displayLegalTitle = legalTitle || undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f5f5f5', overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div style={{ backgroundColor: 'white', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 20, width: '100%', boxSizing: 'border-box' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minWidth: '44px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Back</span>
        </button>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minWidth: '44px' }}>{user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}</button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '12px', backgroundColor: '#F9FAFB', minHeight: 0 }}>
        {displayLegalTitle && <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}><div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>{footerContent[displayLegalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}</div></div>}
        {topicId === 'pricing' && <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}><PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} /></div>}
        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}
        {isAnalysisMode && !displayLegalTitle && (
          <StockAnalysisModule 
            t={t} 
            data={analysisData} 
            isLoading={isLoading} 
            langKey={langKey} 
          />
        )}
      </div>
      
      {isAnalysisMode && !displayLegalTitle && (
        <div style={{ backgroundColor: 'white', borderTop: '1px solid #E5E7EB', padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', flexShrink: 0, zIndex: 20, width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          
          {/* AI Enhancement Toggle */}
          <div style={{ 
            marginBottom: '8px', 
            padding: '6px 12px', 
            backgroundColor: useAIEnhancement ? '#FEF3C7' : '#F3F4F6',
            borderRadius: '8px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
              <input
                type="checkbox"
                checked={useAIEnhancement}
                onChange={(e) => setUseAIEnhancement(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', fontWeight: '500', color: '#374151' }}>
                {langKey === 'Cantonese' ? '🤖 AI增強分析' : langKey === '简体中文' ? '🤖 AI增强分析' : '🤖 AI Enhancement'}
              </span>
              <span style={{ fontSize: '9px', color: '#6B7280' }}>
                {langKey === 'Cantonese' ? '(網關選項)' : langKey === '简体中文' ? '(网关选项)' : '(Gateway option)'}
              </span>
            </label>
            {useAIEnhancement && (
              <div style={{ fontSize: '9px', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                {langKey === 'Cantonese' ? '啟用中' : langKey === '简体中文' ? '启用中' : 'Active'}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <button onClick={() => setIsMenuOpen(true)} style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>+</button>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={exampleText} onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()} style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '24px', border: '1px solid #E5E7EB', outline: 'none', minWidth: 0 }} />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {renderButtonWithCross(isListening, handleMicToggle, 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>, 
              '#3B82F6', '#EF4444'
            )}
            
            {renderButtonWithCross(isSpeakerActive, handleSpeakerToggle, 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>, 
              '#EF4444', '#9CA3AF'
            )}
            
            {renderButtonWithCross(isPaused, handlePauseToggle, 
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, 
              '#EF4444', '#9CA3AF'
            )}
            
            <button 
              onClick={handleAnalyze} 
              disabled={!inputValue.trim() || isLoading} 
              style={{ 
                flex: 1, 
                height: '48px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: (inputValue.trim() && !isLoading) 
                  ? (useAIEnhancement ? '#F59E0B' : '#22C55E') 
                  : '#D1D5DB', 
                color: 'white', 
                border: 'none', 
                cursor: (inputValue.trim() && !isLoading) ? 'pointer' : 'not-allowed', 
                position: 'relative' 
              }}
            >
              {isLoading 
                ? (useAIEnhancement 
                    ? (langKey === 'Cantonese' ? '🤖 AI思考中...' : langKey === '简体中文' ? '🤖 AI思考中...' : '🤖 Thinking...')
                    : (langKey === 'Cantonese' ? '分析中...' : langKey === '简体中文' ? '分析中...' : 'Analyzing...'))
                : (useAIEnhancement 
                    ? (langKey === 'Cantonese' ? '✨ AI分析' : langKey === '简体中文' ? '✨ AI分析' : '✨ AI Analyze')
                    : (langKey === 'Cantonese' ? '發送' : langKey === '简体中文' ? '发送' : 'Send'))}
            </button>
          </div>
        </div>
      )}
      
      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={langKey} />
    </div>
  );
};

export default MobileAnalysis;