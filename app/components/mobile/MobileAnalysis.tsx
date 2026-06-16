"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { VoiceSelector } from '../layout/VoiceSelector';
import { SourceMenu } from '../features/controls/SourceMenu';
import { AboutSection } from '../sections/AboutSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PricingModal } from '../features/pricing/PricingModal';
import { StockAnalysisModule } from '../features/stock-analysis/StockAnalysisModule';
import { footerContent } from '../../constants/content';
import { speak as speakText, stopSpeech as stopSpeaking } from '../../utils/ttsMaster';
import { supabase } from '../../lib/supabase';

interface MobileAnalysisProps {
  langKey: string;
  setLangKey: (lang: string) => void;
  user: any;
  profile?: any;
  onAuthOpen: () => void;
  viewType: string;
  topicId?: string;
  legalTitle?: string | null;
  onBack: () => void;
  voiceLanguage?: string;
  onNavigate?: (page: string, params?: any) => void;
}

// iOS Version Warning Component
const IOSVersionWarning = ({ voiceLanguage }: { voiceLanguage: string }) => {
  const [iosVersion, setIosVersion] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iosMatch = ua.match(/OS (\d+)_/);
    const version = iosMatch ? parseInt(iosMatch[1], 10) : 0;
    setIosVersion(version);
    
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  if (!iosVersion || iosVersion > 18) return null;
  if (voiceLanguage !== 'Mandarin' && voiceLanguage !== 'Taiwanese') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '12px',
      right: '12px',
      background: '#FEF3C7',
      borderLeft: '4px solid #F59E0B',
      padding: '10px 12px',
      borderRadius: '8px',
      zIndex: 10000,
      fontSize: '11px',
      color: '#92400E',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <span style={{ flex: 1 }}>
        Your iOS version ({iosVersion}) has limited voice support. 
        Please change system default voice in: 
        Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; Chinese
      </span>
      <button 
        onClick={() => setVisible(false)}
        style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '16px', 
          cursor: 'pointer',
          color: '#92400E',
          padding: '4px 8px',
          borderRadius: '4px'
        }}
      >
        ✕
      </button>
    </div>
  );
};

const MobileAnalysis: React.FC<MobileAnalysisProps> = ({
  langKey,
  setLangKey,
  user,
  profile,
  onAuthOpen,
  viewType,
  topicId,
  legalTitle,
  onBack,
  voiceLanguage: propVoiceLanguage = 'English',
  onNavigate,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [useAIEnhancement, setUseAIEnhancement] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<string>(propVoiceLanguage);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  <button
  onClick={() => {
    setShowUserMenu(false);
    setShowCancellationModal(true);
  }}
  style={{
    width: '100%',
    padding: '10px 12px',
    textAlign: 'left',
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#EF4444',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}
>
  <span>📴</span> Unsubscribe
</button>
  // Load watchlist items on mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Load voice preference from localStorage
  useEffect(() => {
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice === 'Cantonese' || savedVoice === 'Mandarin' || savedVoice === 'Taiwanese' || savedVoice === 'English') {
      setVoiceLanguage(savedVoice);
    } else {
      setVoiceLanguage(propVoiceLanguage);
    }
  }, [propVoiceLanguage]);
  {showCancellationModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '400px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '48px' }}>💔</span>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1F2937', margin: '12px 0 8px 0' }}>
          We're sad to see you go!
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
          Before you cancel, would you consider downgrading to a more affordable plan?
        </p>
      </div>

      {/* Coffee Plan Option */}
      <div style={{
        border: '1px solid #FDE68A',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: '#FEF3C7'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400E', margin: 0 }}>☕ Monthly Coffee Plan</h4>
            <p style={{ fontSize: '12px', color: '#92400E', margin: '4px 0 0 0' }}>Only $10/month for 300 credits</p>
            <p style={{ fontSize: '11px', color: '#92400E', margin: '2px 0 0 0' }}>Perfect for casual users</p>
          </div>
          <button
            onClick={() => {
              setShowCancellationModal(false);
              // Navigate to coffee plan checkout
              if (onNavigate) {
                onNavigate('content', { view: 'pricing' });
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#D97706',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Downgrade Instead
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={() => setShowCancellationModal(false)}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#6B7280',
            cursor: 'pointer'
          }}
        >
          Return to Dashboard
        </button>
        <button
          onClick={() => {
            setShowCancellationModal(false);
            // Handle actual cancellation here
            if (user) {
              // Call your cancellation API
              fetch('/api/billing/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
              }).then(() => {
                alert('Subscription cancelled. We hope to see you again!');
              });
            }
          }}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#EF4444',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Yes, cancel anyway
        </button>
      </div>
    </div>
  </div>
)}

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const t = {
    analyzingMarket: langKey === 'Traditional Chinese' ? '分析市場中...' : langKey === 'Simplified Chinese' ? '分析市场中...' : 'Analyzing Market...',
  };

  // Initialize speech synthesis on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      setTimeout(() => {
        window.speechSynthesis.cancel();
      }, 100);
    }
  }, []);

  // Auto-speak when analysis data arrives
  useEffect(() => {
    if (analysisData?.summary && isSpeakerActive && !isPaused) {
      console.log("🔊 SPEECH TRIGGERED - Voice:", voiceLanguage);
      setTimeout(() => {
        if (utteranceRef.current) {
          window.speechSynthesis.cancel();
        }
        speakText(analysisData.summary, langKey, voiceLanguage, () => {
          utteranceRef.current = null;
        });
      }, 100);
    }
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [analysisData, isSpeakerActive, isPaused, langKey, voiceLanguage]);

  // Re-fetch analysis when language changes
  useEffect(() => {
    if (analysisData && analysisData.symbol && !isLoading && !isLanguageSwitching) {
      setIsLanguageSwitching(true);
      console.log(`🔄 Mobile: Language changed to ${langKey}, re-fetching ${analysisData.symbol}...`);
      reFetchAnalysis(analysisData.symbol);
    }
  }, [langKey]);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = langKey === 'Traditional Chinese' ? 'zh-TW' : langKey === 'Simplified Chinese' ? 'zh-CN' : 'en-US';
        
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

  const loadWatchlist = () => {
    try {
      const saved = localStorage.getItem('stockWatchlist');
      const items: string[] = saved ? JSON.parse(saved) : [];
      setWatchlistItems(items);
      setWatchlistCount(items.length);
    } catch (error) {
      setWatchlistItems([]);
      setWatchlistCount(0);
    }
  };

  const reFetchAnalysis = async (symbol: string) => {
    if (!symbol) return;
    setIsLoading(true);
    try {
      const endpoint = useAIEnhancement ? '/api/chat/ai-enhanced' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: symbol, 
          language: langKey,
          useAI: useAIEnhancement
        }),
      });
      const data = await response.json();
      setAnalysisData({
        symbol: symbol,
        summary: data.text || data.summary,
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
      console.error('Re-fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsLanguageSwitching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    
    if (!user) {
      const msg = langKey === 'Traditional Chinese' ? '請先登入' : 
                  langKey === 'Simplified Chinese' ? '请先登录' : 
                  'Please login first';
      alert(msg);
      onAuthOpen();
      return;
    }
    
    if (profile && profile.credits <= 0) {
      const msg = langKey === 'Traditional Chinese' ? '積分不足，是否升級計劃？' : 
                  langKey === 'Simplified Chinese' ? '积分不足，是否升级计划？' : 
                  'Insufficient credits. Would you like to upgrade?';
      const confirmUpgrade = confirm(msg);
      if (confirmUpgrade && onNavigate) {
        onNavigate('content', { view: 'pricing' });
      }
      return;
    }
    
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
      stopSpeaking();
      setIsSpeakerActive(false);
      setIsPaused(false);
    } else {
      setIsSpeakerActive(true);
      setIsPaused(false);
      if (analysisData?.summary) {
        if (utteranceRef.current) {
          stopSpeaking();
        }
        speakText(analysisData.summary, langKey, voiceLanguage, () => {
          utteranceRef.current = null;
        });
      }
    }
  };

  const handlePauseToggle = () => {
    if (!analysisData?.summary) return;
    
    if (isSpeakerActive && !isPaused) {
      stopSpeaking();
      setIsPaused(true);
    } else if (isPaused && isSpeakerActive) {
      speakText(analysisData.summary, langKey, voiceLanguage, () => {
        utteranceRef.current = null;
      });
      setIsPaused(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    console.log('📱 Mobile - Selected plan:', planId, 'Price ID:', priceId);
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          userId: user?.id, 
          successUrl: `${window.location.origin}/success`, 
          cancelUrl: window.location.href,
          planId: planId
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('No checkout URL returned');
      }
    } catch (error) { 
      alert('Unable to process payment.'); 
    }
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

  const exampleText = langKey === 'Traditional Chinese' ? '輸入股票代號 e.g.: 0700.hk, 2330.tw, TSLA' : langKey === 'Simplified Chinese' ? '输入股票代码 e.g.: 0700.hk, 2330.tw, TSLA' : 'Enter stock symbol e.g.: 0700.hk, 2330.tw, TSLA';
  const isAnalysisMode = viewType === 'analysis';
  const isWatchlistMode = viewType === 'watchlist';

  const getTitle = () => {
    if (legalTitle) return legalTitle;
    if (topicId === 'about') return langKey === 'Traditional Chinese' ? '關於我們' : langKey === 'Simplified Chinese' ? '关于我们' : 'About';
    if (topicId === 'features') return langKey === 'Traditional Chinese' ? '功能介紹' : langKey === 'Simplified Chinese' ? '功能介绍' : 'Features';
    if (topicId === 'pricing') return langKey === 'Traditional Chinese' ? '服務定價' : langKey === 'Simplified Chinese' ? '服务定价' : 'Pricing';
    if (isWatchlistMode) return langKey === 'Traditional Chinese' ? '📋 觀察清單' : langKey === 'Simplified Chinese' ? '📋 观察清单' : '📋 Watchlist';
    return langKey === 'Traditional Chinese' ? 'AI 分析' : langKey === 'Simplified Chinese' ? 'AI 分析' : 'AI Analysis';
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

  // Watchlist add function for mobile
  const addToWatchlist = () => {
    const symbol = analysisData?.symbol;
    if (!symbol) {
      console.log('No symbol to add');
      return;
    }
    
    try {
      console.log(`Adding ${symbol} to watchlist...`);
      
      const saved = localStorage.getItem('stockWatchlist');
      let watchlist: string[] = saved ? JSON.parse(saved) : [];
      console.log('Current watchlist:', watchlist);
      
      if (watchlist.includes(symbol)) {
        setWatchlistMessage(`⚠️ ${symbol} is already in your watchlist!`);
        setTimeout(() => setWatchlistMessage(null), 3000);
        return;
      }
      
      if (watchlist.length >= 10) {
        setWatchlistMessage(`⚠️ Watchlist limit reached (max 10 stocks).`);
        setTimeout(() => setWatchlistMessage(null), 3000);
        return;
      }
      
      watchlist.push(symbol);
      localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
      console.log(`✅ ${symbol} added to watchlist`);
      setWatchlistCount(watchlist.length);
      setWatchlistItems(watchlist);
      setWatchlistMessage(`✅ ${symbol} added to your watchlist!`);
      
      setTimeout(() => setWatchlistMessage(null), 3000);
      
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setWatchlistMessage(`⚠️ Error adding ${symbol} to watchlist`);
      setTimeout(() => setWatchlistMessage(null), 3000);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = (symbol: string) => {
    try {
      const updated = watchlistItems.filter(item => item !== symbol);
      setWatchlistItems(updated);
      setWatchlistCount(updated.length);
      localStorage.setItem('stockWatchlist', JSON.stringify(updated));
      setWatchlistMessage(`🗑️ ${symbol} removed from watchlist`);
      setTimeout(() => setWatchlistMessage(null), 3000);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  // Analyze a symbol from watchlist
  const analyzeWatchlistItem = (symbol: string) => {
    setInputValue(symbol);
    // Navigate back to analysis mode
    if (onNavigate) {
      onNavigate('analysis');
    }
    // Auto-analyze after navigation
    setTimeout(() => {
      handleAnalyze();
    }, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f5f5f5', overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <IOSVersionWarning voiceLanguage={voiceLanguage} />
      
      <div style={{ backgroundColor: 'white', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 20, width: '100%', boxSizing: 'border-box' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minWidth: '44px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Back</span>
        </button>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <VoiceSelector 
            currentVoice={voiceLanguage}
            onVoiceChange={setVoiceLanguage}
          />
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          
          {user ? (
            <div className="user-menu-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '10px', color: '#374151', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </button>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '10px',
                  marginTop: '8px',
                  width: '220px',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 100
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1F2937', wordBreak: 'break-all' }}>{user?.email}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <p style={{ fontSize: '10px', color: '#6B7280' }}>Credits:</p>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#F59E0B' }}>{profile?.credits || 100}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <p style={{ fontSize: '10px', color: '#6B7280' }}>Plan:</p>
                      <p style={{ fontSize: '11px', fontWeight: '500', color: '#1F2937' }}>{profile?.subscription_status || 'Free Explorer'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to watchlist view
                      if (onNavigate) {
                        onNavigate('watchlist');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      backgroundColor: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#4B5563',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⭐</span> Watchlist ({watchlistCount})
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate?.('content', { view: 'pricing' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      backgroundColor: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#4B5563',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⬆️</span> Change Plan
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate?.('content', { view: 'pricing' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      backgroundColor: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#EF4444',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📴</span> Unsubscribe
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setShowUserMenu(false);
                      window.location.reload();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      backgroundColor: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minWidth: '44px' }}>
              {langKey === 'Traditional Chinese' ? '登入' : langKey === 'Simplified Chinese' ? '登录' : 'Login'}
            </button>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '12px', backgroundColor: '#F9FAFB', minHeight: 0 }}>
        {displayLegalTitle && <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}><div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>{footerContent[displayLegalTitle]?.[langKey === "Traditional Chinese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}</div></div>}
        {topicId === 'pricing' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
            <PricingModal 
              isOpen={true} 
              onClose={onBack} 
              user={user} 
              profile={profile} 
              onSelectPlan={handleSelectPlan} 
              showRetentionOnly={false} 
              langKey={langKey} 
            />
          </div>
        )}
        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}
        
        {/* Watchlist View */}
        {isWatchlistMode && !displayLegalTitle && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                {langKey === 'Traditional Chinese' ? '📋 我的觀察清單' : 
                 langKey === 'Simplified Chinese' ? '📋 我的观察清单' : 
                 '📋 My Watchlist'}
              </h3>
              <span style={{ fontSize: '12px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '2px 10px', borderRadius: '12px' }}>
                {watchlistCount} {langKey === 'Traditional Chinese' ? '個' : langKey === 'Simplified Chinese' ? '个' : 'items'}
              </span>
            </div>
            
            {watchlistMessage && (
              <div style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: watchlistMessage.includes('✅') || watchlistMessage.includes('🗑️') ? '#ECFDF5' : '#FEF2F2',
                color: watchlistMessage.includes('✅') || watchlistMessage.includes('🗑️') ? '#10B981' : '#EF4444',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                {watchlistMessage}
              </div>
            )}
            
            {watchlistItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#9CA3AF'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>
                  {langKey === 'Traditional Chinese' ? '你的觀察清單是空的' : 
                   langKey === 'Simplified Chinese' ? '你的观察清单是空的' : 
                   'Your watchlist is empty'}
                </p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  {langKey === 'Traditional Chinese' ? '返回分析頁面添加股票到觀察清單' : 
                   langKey === 'Simplified Chinese' ? '返回分析页面添加股票到观察清单' : 
                   'Go back to analysis to add stocks'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {watchlistItems.map((symbol, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1F2937' }}>{symbol}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => analyzeWatchlistItem(symbol)}
                        style={{
                          padding: '5px 14px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {langKey === 'Traditional Chinese' ? '📊 分析' : 
                         langKey === 'Simplified Chinese' ? '📊 分析' : 
                         '📊 Analyze'}
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(symbol)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('analysis');
                }
              }}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
                fontWeight: '500'
              }}
            >
              {langKey === 'Traditional Chinese' ? '← 返回分析' : 
               langKey === 'Simplified Chinese' ? '← 返回分析' : 
               '← Back to Analysis'}
            </button>
          </div>
        )}
        
        {/* Analysis View */}
        {isAnalysisMode && !displayLegalTitle && (
          <>
            {/* Watchlist Message */}
            {watchlistMessage && (
              <div style={{
                marginBottom: '8px',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: watchlistMessage.includes('✅') || watchlistMessage.includes('🗑️') ? '#ECFDF5' : '#FEF2F2',
                color: watchlistMessage.includes('✅') || watchlistMessage.includes('🗑️') ? '#10B981' : '#EF4444',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                {watchlistMessage}
              </div>
            )}
            
            {/* Add to Watchlist Button - Mobile Compact */}
            {analysisData?.symbol && user && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                marginBottom: '8px',
                padding: '0 4px'
              }}>
                <button
                  onClick={addToWatchlist}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>⭐</span>
                  Add <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{analysisData.symbol}</span>
                </button>
              </div>
            )}
            
            <StockAnalysisModule 
              t={t} 
              data={analysisData} 
              isLoading={isLoading} 
              langKey={langKey} 
              voiceLanguage={voiceLanguage}
            />
          </>
        )}
      </div>
      
      {/* Only show input controls in analysis mode */}
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
                {langKey === 'Traditional Chinese' ? '🤖 AI增強分析' : 
                 langKey === 'Simplified Chinese' ? '🤖 AI增强分析' : 
                 '🤖 AI Enhancement'}
              </span>
              <span style={{ fontSize: '9px', color: '#6B7280' }}>
                {langKey === 'Traditional Chinese' ? '(網關選項)' : 
                 langKey === 'Simplified Chinese' ? '(网关选项)' : 
                 '(Gateway option)'}
              </span>
            </label>
            {useAIEnhancement && (
              <div style={{ fontSize: '9px', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                {langKey === 'Traditional Chinese' ? '啟用中' : langKey === 'Simplified Chinese' ? '启用中' : 'Active'}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <button onClick={() => setIsMenuOpen(true)} style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>+</button>
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              placeholder={exampleText} 
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()} 
              style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '24px', border: '1px solid #E5E7EB', outline: 'none', minWidth: 0 }} 
            />
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
                    ? (langKey === 'Traditional Chinese' ? '🤖 AI思考中...' : langKey === 'Simplified Chinese' ? '🤖 AI思考中...' : '🤖 Thinking...')
                    : (langKey === 'Traditional Chinese' ? '分析中...' : langKey === 'Simplified Chinese' ? '分析中...' : 'Analyzing...'))
                : (useAIEnhancement 
                    ? (langKey === 'Traditional Chinese' ? '✨ AI分析' : langKey === 'Simplified Chinese' ? '✨ AI分析' : '✨ AI Analyze')
                    : (langKey === 'Traditional Chinese' ? '發送' : langKey === 'Simplified Chinese' ? '发送' : 'Send'))}
            </button>
          </div>
        </div>
      )}
      
      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={langKey} />
    </div>
  );
};

export default MobileAnalysis;