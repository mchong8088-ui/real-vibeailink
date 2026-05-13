// components/mobile/MobileAnalysis.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { AnalysisDashboard } from '../features/stock-analysis/AnalysisDashboard';
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
  // Input and Analysis States
  const [inputValue, setInputValue] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice Control States
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Text-to-Speech for analysis output
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
          symbol: inputValue.trim().toUpperCase(),
          language: langKey,
          langKey: langKey
        }),
      });
      const data = await response.json();
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: data.text || data.summary || `Analysis for ${inputValue.trim().toUpperCase()} completed.`,
        technical: data.technical || { rsi: 52.5, macd: "Neutral", price: "---" }
      });
    } catch (error) {
      console.error('Error:', error);
      setAnalysisData({
        symbol: inputValue.trim().toUpperCase(),
        summary: `無法獲取 ${inputValue.trim().toUpperCase()} 的分析。請稍後再試。`,
        technical: { rsi: "50.0", macd: "Neutral", price: "---" }
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

  const exampleText = "輸入股票代號 e.g.: 0700.hk, TSLA";
  const isAnalysisMode = viewType === 'analysis';

  // Get title based on view
  const getTitle = () => {
    if (legalTitle) return legalTitle;
    if (topicId === 'about') return '關於我們';
    if (topicId === 'features') return '功能介紹';
    if (topicId === 'pricing') return '服務定價';
    return 'AI 分析';
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white" style={{ height: '100vh', overflow: 'hidden' }}>
      
      {/* TOP BAR - Fixed */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
        <div className="flex gap-2">
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} className="text-blue-600 font-semibold text-sm">
            {user ? 'Welcome' : '登入'}
          </button>
        </div>
      </div>

      {/* SCROLLABLE MEAT AREA - Takes remaining space */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4" style={{ minHeight: 0 }}>
        {/* Legal Content */}
        {legalTitle && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {footerContent[legalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "內容即將推出..."}
            </div>
          </div>
        )}

        {/* Pricing Modal */}
        {topicId === 'pricing' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />
          </div>
        )}

        {/* About Section */}
        {topicId === 'about' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <AboutSection lang={langKey} />
          </div>
        )}

        {/* Features Section */}
        {topicId === 'features' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <FeaturesSection lang={langKey} />
          </div>
        )}

        {/* Analysis Mode - With Input at bottom */}
        {isAnalysisMode && !legalTitle && (
          <>
            {/* Analysis Dashboard - Scrollable */}
            <div className="pb-4">
              <AnalysisDashboard data={analysisData} isLoading={isLoading} langKey={langKey} />
            </div>
            
            {/* Hidden spacer for input */}
            <div className="h-20"></div>
          </>
        )}
      </div>

      {/* FIXED INPUT BAR - Only in analysis mode, at bottom of screen */}
      {isAnalysisMode && !legalTitle && (
        <div className="bg-white border-t border-gray-100 px-3 py-3 flex-shrink-0">
          {/* Input Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMicToggle}
              className={`p-2 rounded-full ${isListening ? 'bg-blue-500' : 'bg-red-500'} text-white w-10 h-10 flex items-center justify-center flex-shrink-0`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "聆聽中..." : exampleText}
                className="w-full px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-full focus:bg-white transition outline-none"
                style={{ border: 'none' }}
              />
            </div>

            <button
              onClick={handleSpeakerToggle}
              className={`p-2 rounded-full ${isSpeakerActive ? 'bg-red-500' : 'bg-gray-400'} text-white w-10 h-10 flex items-center justify-center flex-shrink-0`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            <button
              onClick={handlePauseToggle}
              className={`p-2 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-red-500'} text-white w-10 h-10 flex items-center justify-center flex-shrink-0`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button
              onClick={handleAnalyze}
              disabled={!inputValue.trim()}
              className={`p-2 rounded-full ${inputValue.trim() ? 'bg-green-500' : 'bg-gray-300'} text-white w-10 h-10 flex items-center justify-center flex-shrink-0`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M17 7L7 17" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAnalysis;