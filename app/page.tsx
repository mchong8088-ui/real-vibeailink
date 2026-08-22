"use client";
import React, { useState, useEffect } from 'react'; 
import { SourceMenu } from './components/features/controls/SourceMenu';
import { SmartInputSystem } from './components/features/controls/SmartInputSystem';
import { StockAnalysisModule } from './components/features/stock-analysis/StockAnalysisModule';
import { PortfolioModule } from './components/features/portfolio/PortfolioModule';
import { AIResearchAssistantModal } from './components/AIResearchAssistant';
import { VoiceProviderModal } from './components/VoiceProviderModal';
import { AuthModal } from './components/modals/AuthModal';
import { LanguageToggle } from './components/layout/LanguageToggle'; 
import { VoiceSelector } from './components/layout/VoiceSelector';
import { AboutSection } from './components/sections/AboutSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingModal } from './components/features/pricing/PricingModal';
import { WatchlistModal } from './components/WatchlistModal';
import UserMenu from './components/auth/UserMenu';
import { supabase } from './lib/supabase';
import { useLanguage } from './context/LanguageContext';
// Import mobile components
import MobileLanding from './components/mobile/MobileLanding';
import MobileAnalysis from './components/mobile/MobileAnalysis';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function VibeAiMaster() {
  const { t, language, setLanguage } = useLanguage();
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [systemState, setSystemState] = useState({ os: "Detecting...", isMobile: false });
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"analysis" | "portfolio" | "about" | "features" | "pricing">("analysis");
  const [legalTitle, setLegalTitle] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Modals & Button Toggles
  const [showVoiceProvider, setShowVoiceProvider] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [enableAIEnhancement, setEnableAIEnhancement] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  const [stockOfTheDay, setStockOfTheDay] = useState<any>(null);
  const [loadingStockOfDay, setLoadingStockOfDay] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<string>('English');

  // Mobile state
  const [mobileView, setMobileView] = useState<'landing' | 'analysis' | 'content'>('landing');
  const [mobileContentType, setMobileContentType] = useState<string | null>(null);

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice === 'Cantonese' || savedVoice === 'Mandarin' || savedVoice === 'English' || savedVoice === 'Taiwanese') {
      setVoiceLanguage(savedVoice);
    }
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setProfile(data);
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            credits: 100,
            subscription_plan: 'Free Explorer'
          })
          .select()
          .single();
        
        if (newProfile && !insertError) {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN' && session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { 
    setIsHydrated(true); 
  }, []);

  useEffect(() => {
    setMounted(true);
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 1024;
    let detectedOS = "Standard OS";
    if (navigator.userAgent.indexOf("Win") !== -1) detectedOS = "Windows";
    if (navigator.userAgent.indexOf("Mac") !== -1) detectedOS = "macOS";
    setSystemState({ os: detectedOS, isMobile: isMobileDevice });
    
    fetchStockOfTheDay();
  }, []);

  const fetchStockOfTheDay = async () => {
    setLoadingStockOfDay(true);
    try {
      const response = await fetch('/api/stock-of-the-day');
      const data = await response.json();
      setStockOfTheDay(data);
    } catch (error) {
      console.error('Failed to fetch stock of the day:', error);
    } finally {
      setLoadingStockOfDay(false);
    }
  };

  const analyzeStockOfTheDay = () => {
    if (stockOfTheDay?.symbol) {
      handleAnalyzeRequest(stockOfTheDay.symbol, [], false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setShowUserMenu(false);
    window.location.href = '/';
  };

  const checkCreditsBeforeAnalysis = async (): Promise<boolean> => {
    if (!user) {
      const langMsg = language === 'Traditional Chinese' ? '請先登入' : 
                      language === 'Simplified Chinese' ? '请先登录' : 
                      'Please login first';
      alert(langMsg);
      setIsAuthOpen(true);
      return false;
    }
    
    if (!profile) {
      alert('User profile not found. Please contact support.');
      return false;
    }
    
    if (profile.credits <= 0) {
      const langMsg = language === 'Traditional Chinese' ? '積分不足，是否升級計劃？' : 
                      language === 'Simplified Chinese' ? '积分不足，是否升级计划？' : 
                      'Insufficient credits. Would you like to upgrade?';
      const confirmUpgrade = confirm(langMsg);
      if (confirmUpgrade) {
        setCurrentView('pricing');
      }
      return false;
    }
    
    return true;
  };

  const handleAnalyzeRequest = async (ticker: string, attachments?: any[], useAI?: boolean) => {
    const hasCredits = await checkCreditsBeforeAnalysis();
    if (!hasCredits) return;
    
    setIsLoading(true);
    try {
      let userContent = null;
      if (attachments && attachments.length > 0) {
        const attachment = attachments[0];
        if (attachment.content) {
          userContent = attachment.content;
        }
      }
      
      const endpoint = (useAI || enableAIEnhancement) ? '/api/chat/ai-enhanced' : '/api/chat';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: ticker, 
          language: language,
          userContent: userContent,
          useAI: useAI || enableAIEnhancement
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.summary || 'Analysis failed');
      }
      
      setAnalysisData(data);
      
      setTimeout(() => {
        const analysisElement = document.getElementById('analysis-content');
        if (analysisElement) {
          analysisElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = language === 'Traditional Chinese' ? `無法分析 ${ticker}，請重新輸入。` :
                       language === 'Simplified Chinese' ? `无法分析 ${ticker}，请重新输入。` :
                       `Unable to analyze ${ticker}. Please try again.`;
      
      setAnalysisData({ 
        symbol: ticker, 
        summary: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
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
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        alert('Unable to process payment. Please try again.');
      }
    } catch (error) { 
      alert('Unable to process payment. Please try again.'); 
    }
  };

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split('@')[0].substring(0, 10);
    return 'User';
  };

  const getTranslatedText = () => {
    if (language === 'Traditional Chinese') {
      return {
        financeText: '您的財務及市場分析師',
        disclaimer: '免責聲明',
        terms: '服務條款',
        privacy: '隱私政策',
        refund: '退款政策',
        contact: '聯絡我們',
        aiStock: 'AI 股票',
        portfolio: '投資組合',
        about: '關於',
        features: '功能',
        pricing: '定價',
        watchlist: '⭐',
        stockOfDay: '今日精選股票',
        analyze: '分析',
        inputPlaceholderDisabled: '開啟 AI 增強即可進行深度提問',
        inputPlaceholderEnabled: '輸入股票代號、策略或任何市場問題...',
        myWatchlist: '⭐ 關注列表',
        refresh: '重新整理',
        noWatchlist: '暫無股票',
        voiceProviderBtn: '🎙️ Voice Provider',
        aiAssistantBtn: '🤖 AI Assistant',
        aiEnhancementBtn: '⚡ AI Enhancement',
        watchlistTitle: '⭐ 我的關注列表',
        legendTitle: '📊 信號說明',
        legendBuy: '🟢 綠色 = RSI低於30 (超賣) - 考慮買入',
        legendSell: '🔴 紅色 = RSI高於70 (超買) - 考慮賣出',
        legendNeutral: '⚪ 灰色 = RSI 30-70 (中性) - 持有觀望',
        loadingData: '載入中...',
        noData: '無數據',
        price: '價格',
        change: '漲跌',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: '趨勢',
        clickToAnalyze: '點擊查看完整分析',
        fetchingData: '獲取數據中...',
        addPlaceholder: '輸入代號',
        add: '新增',
        limit: '最多10隻',
        max: '已達上限',
        empty: '暫無追蹤股票',
        addHint: '點擊 + 新增股票',
        remove: '移除',
      };
    } else if (language === 'Simplified Chinese') {
      return {
        financeText: '您的财务及市场分析师',
        disclaimer: '免责声明',
        terms: '服务条款',
        privacy: '隐私政策',
        refund: '退款政策',
        contact: '联系我们',
        aiStock: 'AI 股票',
        portfolio: '投资组合',
        about: '关于',
        features: '功能',
        pricing: '定价',
        watchlist: '⭐',
        stockOfDay: '今日精选股票',
        analyze: '分析',
        inputPlaceholderDisabled: '开启 AI 增强即可进行深度提问',
        inputPlaceholderEnabled: '输入股票代码、策略或任何市场问题...',
        myWatchlist: '⭐ 关注列表',
        refresh: '刷新',
        noWatchlist: '暂无股票',
        voiceProviderBtn: '🎙️ Voice Provider',
        aiAssistantBtn: '🤖 AI Assistant',
        aiEnhancementBtn: '⚡ AI Enhancement',
        watchlistTitle: '⭐ 我的关注列表',
        legendTitle: '📊 信号说明',
        legendBuy: '🟢 绿色 = RSI低于30 (超卖) - 考虑买入',
        legendSell: '🔴 红色 = RSI高于70 (超买) - 考虑卖出',
        legendNeutral: '⚪ 灰色 = RSI 30-70 (中性) - 持有观望',
        loadingData: '载入中...',
        noData: '无数据',
        price: '价格',
        change: '涨跌',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: '趋势',
        clickToAnalyze: '点击查看完整分析',
        fetchingData: '获取数据中...',
        addPlaceholder: '输入代码',
        add: '新增',
        limit: '最多10只',
        max: '已达上限',
        empty: '暂无追踪股票',
        addHint: '点击 + 新增股票',
        remove: '移除',
      };
    } else {
      return {
        financeText: 'Your Finance & Market Analysts',
        disclaimer: 'DISCLAIMER',
        terms: 'TERMS',
        privacy: 'PRIVACY',
        refund: 'REFUND',
        contact: 'CONTACT',
        aiStock: 'AI STOCK',
        portfolio: 'PORTFOLIO',
        about: 'ABOUT',
        features: 'FEATURES',
        pricing: 'PRICING',
        watchlist: '⭐',
        stockOfDay: '⭐ Stock of the Day',
        analyze: 'Analyze',
        inputPlaceholderDisabled: 'Enable AI Enhancement to ask questions',
        inputPlaceholderEnabled: 'Type stock ticker, strategy, or financial questions...',
        myWatchlist: '⭐ Watchlist',
        refresh: 'Refresh',
        noWatchlist: 'No stocks yet',
        voiceProviderBtn: '🎙️ Voice Provider',
        aiAssistantBtn: '🤖 AI Assistant',
        aiEnhancementBtn: '⚡ AI Enhancement',
        watchlistTitle: '⭐ My Watchlist',
        legendTitle: '📊 Signal Legend',
        legendBuy: '🟢 Green = RSI below 30 (Oversold) - Consider BUY',
        legendSell: '🔴 Red = RSI above 70 (Overbought) - Consider SELL',
        legendNeutral: '⚪ Gray = RSI 30-70 (Neutral) - HOLD',
        loadingData: 'Loading...',
        noData: 'No data',
        price: 'Price',
        change: 'Change',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: 'Trend',
        clickToAnalyze: 'Click to view full analysis',
        fetchingData: 'Fetching data...',
        addPlaceholder: 'Enter symbol',
        add: 'Add',
        limit: 'Max 10',
        max: 'Limit reached',
        empty: 'No stocks in watchlist',
        addHint: 'Click + to add stocks',
        remove: 'Remove',
      };
    }
  };

  const text = getTranslatedText();

  const getWatchlist = () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('stockWatchlist') || '[]');
    } catch {
      return [];
    }
  };

  // Mobile navigation handler
  const handleMobileNavigate = (page: string, params?: any) => {
    if (page === 'analysis') {
      setMobileView('analysis');
      setCurrentView('analysis');
    } else if (page === 'content') {
      setMobileView('content');
      setMobileContentType(params?.view || 'about');
      if (params?.view === 'pricing') setCurrentView('pricing');
      else if (params?.view === 'about') setCurrentView('about');
      else if (params?.view === 'features') setCurrentView('features');
    } else if (page === 'watchlist') {
      setShowWatchlistModal(true);
    } else if (page === 'landing') {
      setMobileView('landing');
    }
  };

  // Handle mobile auth open
  const handleMobileAuthOpen = () => {
    setIsAuthOpen(true);
  };

  // Close auth modal
  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  if (!isHydrated || !mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 16px auto' }} />
          <p>Loading vibeAiLink...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MOBILE RENDER
  // ============================================================
  if (isMobile) {
    if (mobileView === 'landing') {
      return (
        <>
          <MobileLanding
            langKey={language}
            setLangKey={setLanguage}
            onAuthOpen={handleMobileAuthOpen}
            user={user}
            profile={profile}
            onNavigate={handleMobileNavigate}
          />
          {isAuthOpen && !user && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} langKey={language} />
            </div>
          )}
        </>
      );
    }

    if (mobileView === 'analysis') {
      return (
        <>
          <MobileAnalysis
            langKey={language}
            setLangKey={setLanguage}
            user={user}
            profile={profile}
            onAuthOpen={handleMobileAuthOpen}
            viewType={currentView}
            topicId={mobileContentType || undefined}
            legalTitle={legalTitle}
            onBack={() => {
              if (currentView === 'analysis') {
                setMobileView('landing');
              } else {
                setCurrentView('analysis');
                setMobileView('analysis');
              }
              setLegalTitle(null);
            }}
            voiceLanguage={voiceLanguage}
            onNavigate={handleMobileNavigate}
          />
          {isAuthOpen && !user && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} langKey={language} />
            </div>
          )}
        </>
      );
    }

    if (mobileView === 'content') {
      return (
        <>
          <MobileAnalysis
            langKey={language}
            setLangKey={setLanguage}
            user={user}
            profile={profile}
            onAuthOpen={handleMobileAuthOpen}
            viewType={currentView}
            topicId={mobileContentType || undefined}
            legalTitle={legalTitle}
            onBack={() => {
              setMobileView('landing');
              setLegalTitle(null);
              setMobileContentType(null);
            }}
            voiceLanguage={voiceLanguage}
            onNavigate={handleMobileNavigate}
          />
          {isAuthOpen && !user && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} langKey={language} />
            </div>
          )}
        </>
      );
    }
  }

  // ============================================================
  // DESKTOP RENDER
  // ============================================================
  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {/* Header Bar - Removed WATCHLIST text, only keep icon */}
        <div style={{ backgroundColor: 'white', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['analysis', 'portfolio', 'about', 'features', 'pricing'].map(v => (
              <button 
                key={v} 
                onClick={() => setCurrentView(v as any)} 
                style={{ fontSize: '14px', fontWeight: currentView === v ? 'bold' : 'normal', color: currentView === v ? '#2563EB' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', borderBottom: currentView === v ? '2px solid #2563EB' : 'none' }}
              >
                {v === 'analysis' ? text.aiStock : v === 'portfolio' ? text.portfolio : text[v as keyof typeof text]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <VoiceSelector currentVoice={voiceLanguage} onVoiceChange={setVoiceLanguage} mode="language" />
            <LanguageToggle currentLang={language} onLangChange={setLanguage as any} />
            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px' }}>{getUserDisplayName()}</span>
                </button>
                {showUserMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100 }}>
                    <UserMenu 
                      user={user} 
                      profile={profile} 
                      onLogout={handleLogout} 
                      onOpenPricingPage={() => { setShowUserMenu(false); setCurrentView('pricing'); }} 
                      onSelectPlan={handleSelectPlan} 
                      onClose={() => setShowUserMenu(false)}
                      onAnalyzeStock={(symbol) => handleAnalyzeRequest(symbol, [], false)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>LOGIN</button>
            )}
          </div>
        </div>

        {/* Workspace Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Avatar Panel */}
          <div style={{ width: '26%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', overflow: 'auto', minWidth: '240px' }}>
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', marginBottom: '20px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Sofia" />
            </div>
            <h2 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '20px', textAlign: 'center', margin: '0 0 6px 0' }}>
              Michael & Sofia
            </h2>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#2563EB', textAlign: 'center', margin: '0' }}>{text.financeText}</p>
            
            {/* Quick Watchlist Stats */}
            <div style={{ marginTop: '16px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {text.myWatchlist}: <strong style={{ color: '#059669' }}>{getWatchlist().length}</strong>
              </span>
            </div>
          </div>

          {/* Main Display Area */}
          <div style={{ width: '74%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div id="analysis-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {currentView === "analysis" && (
                <>
                  {stockOfTheDay && !analysisData && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>⭐</span>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400E' }}>{text.stockOfDay}</div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#D97706' }}>{stockOfTheDay.symbol} - {stockOfTheDay.name}</div>
                          {stockOfTheDay.price && <div style={{ fontSize: '11px', color: '#B45309' }}>Price: {stockOfTheDay.price}</div>}
                        </div>
                      </div>
                      <button onClick={analyzeStockOfTheDay} style={{ backgroundColor: '#D97706', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{text.analyze}</button>
                    </div>
                  )}

                  <StockAnalysisModule 
                    t={t} 
                    data={analysisData} 
                    isLoading={isLoading} 
                    langKey={language} 
                    onAnalyze={(symbol) => handleAnalyzeRequest(symbol, [], enableAIEnhancement)}
                    user={user}
                    profile={profile}
                    onUpgradePlan={() => setCurrentView('pricing')}
                  />
                </>
              )}
              {currentView === "portfolio" && <PortfolioModule langKey={language} onAnalyzeStock={(symbol) => handleAnalyzeRequest(symbol, [], false)} />}
              {currentView === "pricing" && <PricingModal isOpen={true} onClose={() => setCurrentView("analysis")} user={user} profile={profile} onSelectPlan={handleSelectPlan} showRetentionOnly={false} langKey={language} />}
              {currentView === "about" && <AboutSection lang={language} />}
              {currentView === "features" && <FeaturesSection lang={language} />}
            </div>

            {/* Bottom Controls */}
            <div style={{ backgroundColor: 'white', padding: '8px 16px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button 
                  onClick={() => setShowVoiceProvider(true)}
                  style={{
                    backgroundColor: '#10B981', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  {text.voiceProviderBtn}
                </button>

                <button 
                  onClick={() => setShowAIAssistant(true)}
                  style={{
                    backgroundColor: '#10B981', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  {text.aiAssistantBtn}
                </button>

                <button 
                  onClick={() => setEnableAIEnhancement(!enableAIEnhancement)}
                  style={{
                    backgroundColor: enableAIEnhancement ? '#059669' : '#10B981',
                    color: 'white', border: 'none', borderRadius: '8px', padding: '6px 8px',
                    fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  {text.aiEnhancementBtn} {enableAIEnhancement ? ' (ON)' : ' (OFF)'}
                </button>

                <button 
                  onClick={() => setShowWatchlistModal(true)}
                  style={{
                    backgroundColor: '#10B981', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  {text.myWatchlist}
                </button>
              </div>
              
              <SmartInputSystem 
                langKey={language} 
                onAnalyze={(symbol, attachments) => handleAnalyzeRequest(symbol, attachments, enableAIEnhancement)} 
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo} 
                analysisText={analysisData?.summary}
                voiceLanguage={voiceLanguage}
                placeholder={enableAIEnhancement ? text.inputPlaceholderEnabled : text.inputPlaceholderDisabled}
              />
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: 'white', padding: '6px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.disclaimer}</button>
              <button onClick={() => setLegalTitle('條款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.terms}</button>
              <button onClick={() => setLegalTitle('隱私')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.privacy}</button>
              <button onClick={() => setLegalTitle('退款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.refund}</button>
              <button onClick={() => setLegalTitle('聯絡')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.contact}</button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <VoiceProviderModal
          isOpen={showVoiceProvider}
          onClose={() => setShowVoiceProvider(false)}
          user={user}
          profile={profile}
          onUpgradePlan={() => setCurrentView('pricing')}
          langKey={language}
        />

        <AIResearchAssistantModal
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          user={user}
          profile={profile}
          onUpgradePlan={() => setCurrentView('pricing')}
          langKey={language}
        />

        {/* Enhanced Watchlist Modal */}
        {showWatchlistModal && (
          <WatchlistModal
            isOpen={showWatchlistModal}
            onClose={() => setShowWatchlistModal(false)}
            onSelectStock={(symbol) => {
              setShowWatchlistModal(false);
              handleAnalyzeRequest(symbol, [], false);
            }}
            langKey={language}
          />
        )}

        <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={() => setIsMenuOpen(false)} langKey={language} />
        
        {/* Desktop AuthModal */}
        {isAuthOpen && !user && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} langKey={language} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}