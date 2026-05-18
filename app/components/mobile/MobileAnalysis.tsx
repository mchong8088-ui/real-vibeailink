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

  // Compact analysis display for mobile
  const CompactAnalysis = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-xl p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">{t.analyzingMarket}</p>
        </div>
      );
    }

    if (!analysisData || !analysisData.symbol) {
      return (
        <div className="bg-white rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm">{langKey === 'Cantonese' ? '請輸入股票代號' : 'Please enter stock symbol'}</p>
          <p className="text-gray-300 text-xs mt-1">e.g.: 0700.hk, TSLA</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-3 space-y-3">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">{analysisData.symbol}</h2>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-400">{langKey === 'Cantonese' ? '價格' : 'Price'}</p>
            <p className="text-sm font-bold text-gray-800">{analysisData.price}</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-400">RSI</p>
            <p className="text-sm font-bold text-blue-600">{analysisData.rsi}</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-gray-400">MACD</p>
            <p className="text-sm font-bold text-emerald-600">{analysisData.macd}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      
      {/* TOP BAR - Return Arrow clearly visible, Title, Language/Login in one row */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-medium">Back</span>
        </button>
        <h2 className="text-base font-semibold text-gray-800">{getTitle()}</h2>
        <div className="flex gap-2 items-center">
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} className="text-blue-600 font-semibold text-sm">
            {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : langKey === '简体中文' ? '登录' : 'Login')}
          </button>
        </div>
      </div>

      {/* SCROLLABLE MEAT AREA */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-3" style={{ minHeight: 0 }}>
        
        {legalTitle && (
          <div className="bg-white rounded-xl p-4 mb-3">
            <div className="text-sm text-gray-700">
              {footerContent[legalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}
            </div>
          </div>
        )}

        {topicId === 'pricing' && (
          <div className="bg-white rounded-xl p-3">
            <PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />
          </div>
        )}

        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}

        {isAnalysisMode && !legalTitle && (
          <>
            <CompactAnalysis />
            {analysisData?.summary && (
              <div className="bg-white rounded-xl p-3 mt-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisData.summary}</p>
              </div>
            )}
            <div className="h-24"></div>
          </>
        )}
      </div>

      {/* FIXED INPUT BAR - Bottom of screen, clear colors and sizes */}
      {isAnalysisMode && !legalTitle && (
        <div className="bg-white border-t border-gray-200 px-3 py-3 flex-shrink-0">
          {/* Input Field Row - Full width */}
          <div className="mb-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? (langKey === 'Cantonese' ? '聆聽中...' : 'Listening...') : exampleText}
              className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-100 rounded-xl focus:bg-white transition outline-none border border-gray-200"
            />
          </div>
          
          {/* Control Buttons Row - All buttons clearly visible */}
          <div className="flex items-center justify-around gap-2">
            {/* MIC Button - Red */}
            <button
              onClick={handleMicToggle}
              className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                isListening ? 'bg-blue-500' : 'bg-red-500'
              } text-white`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-medium">MIC</span>
            </button>

            {/* Speaker Button - Red */}
            <button
              onClick={handleSpeakerToggle}
              className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                isSpeakerActive ? 'bg-red-500' : 'bg-gray-400'
              } text-white`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-xs font-medium">Speaker</span>
            </button>

            {/* Pause Button - Red when active */}
            <button
              onClick={handlePauseToggle}
              className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                isPaused ? 'bg-gray-400' : 'bg-red-500'
              } text-white`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Pause</span>
            </button>

            {/* Send Button - Green */}
            <button
              onClick={handleAnalyze}
              disabled={!inputValue.trim()}
              className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                inputValue.trim() ? 'bg-green-500' : 'bg-gray-300'
              } text-white`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M17 7L7 17" />
              </svg>
              <span className="text-xs font-medium">Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAnalysis;