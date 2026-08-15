"use client";
import React, { useState, useEffect } from 'react'; 
import { SourceMenu } from './components/features/controls/SourceMenu';
import { SmartInputSystem } from './components/features/controls/SmartInputSystem';
import { StockAnalysisModule } from './components/features/stock-analysis/StockAnalysisModule';
import { PortfolioModule } from './components/features/portfolio/PortfolioModule';
import { AIResearchAssistant } from './components/AIResearchAssistant';
import { VoiceProviderModal } from './components/VoiceProviderModal';
import { AuthModal } from './components/modals/AuthModal';
import { LanguageToggle } from './components/layout/LanguageToggle'; 
import { VoiceSelector } from './components/layout/VoiceSelector';
import { AboutSection } from './components/sections/AboutSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingModal } from './components/features/pricing/PricingModal';
import UserMenu from './components/auth/UserMenu';
import { supabase } from './lib/supabase';
import { useLanguage } from './context/LanguageContext';

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
  
  // Voice Provider & AI Enhancement States
  const [showVoiceProvider, setShowVoiceProvider] = useState(false);
  const [enableAIEnhancement, setEnableAIEnhancement] = useState(false);

  const [stockOfTheDay, setStockOfTheDay] = useState<any>(null);
  const [loadingStockOfDay, setLoadingStockOfDay] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<string>('English');

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  useEffect(() => {
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice === 'Cantonese' || savedVoice === 'Mandarin' || savedVoice === 'English') {
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
        inputLabel: '例如: 2330.TW, 0700.HK, TSLA',
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
        stockOfDay: '今日精選股票',
        analyze: '分析',
        checkAiPrompt: '請勾選「啟用 AI 增強功能」以進行深度問答與研判',
        inputPlaceholderDisabled: '請啟用 AI 增強功能以開始提問與分析',
        inputPlaceholderEnabled: '輸入股票代號、策略或任何市場問題...',
        myWatchlist: '⭐ 我的關注列表',
        refresh: '重新整理',
        noWatchlist: '暫無股票',
        voiceProviderBtn: '🎙️ Voice Provider',
      };
    } else if (language === 'Simplified Chinese') {
      return {
        financeText: '您的财务及市场分析师',
        inputLabel: '例如: 2330.TW, 0700.HK, TSLA',
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
        stockOfDay: '今日精选股票',
        analyze: '分析',
        checkAiPrompt: '请勾选“开启 AI 增强功能”以进行深度问答与研判',
        inputPlaceholderDisabled: '请开启 AI 增强功能以开始提问与分析',
        inputPlaceholderEnabled: '输入股票代码、策略或任何市场问题...',
        myWatchlist: '⭐ 我的关注列表',
        refresh: '刷新',
        noWatchlist: '暂无股票',
        voiceProviderBtn: '🎙️ Voice Provider',
      };
    } else {
      return {
        financeText: 'Your Finance & Market Analysts',
        inputLabel: 'Enter a stock symbol or ask any general market/strategy question',
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
        stockOfDay: '⭐ Stock of the Day',
        analyze: 'Analyze',
        checkAiPrompt: 'Check "Enable AI Enhancement" to start comprehensive analysis',
        inputPlaceholderDisabled: 'Enable AI Enhancement to ask questions',
        inputPlaceholderEnabled: 'Type stock ticker, strategy, or general financial questions...',
        myWatchlist: '⭐ My Watchlist',
        refresh: 'Refresh',
        noWatchlist: 'No stocks yet',
        voiceProviderBtn: '🎙️ Voice Provider',
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

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {/* Header Bar */}
        <div style={{ backgroundColor: 'white', padding: '16px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
          <div style={{ display: 'flex', gap: '48px' }}>
            {['analysis', 'portfolio', 'about', 'features', 'pricing'].map(v => (
              <button 
                key={v} 
                onClick={() => setCurrentView(v as any)} 
                style={{ fontSize: '15px', fontWeight: currentView === v ? 'bold' : 'normal', color: currentView === v ? '#2563EB' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', borderBottom: currentView === v ? '2px solid #2563EB' : 'none' }}
              >
                {v === 'analysis' ? text.aiStock : v === 'portfolio' ? text.portfolio : text[v as keyof typeof text]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <VoiceSelector currentVoice={voiceLanguage} onVoiceChange={setVoiceLanguage} />
            <LanguageToggle currentLang={language} onLangChange={setLanguage as any} />
            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '14px' }}>{getUserDisplayName()}</span>
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
              <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>LOGIN</button>
            )}
          </div>
        </div>

        {/* Workspace Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Avatar Panel */}
          <div style={{ width: '28%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflow: 'auto', minWidth: '260px' }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Sofia" />
            </div>
            <h2 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '22px', textAlign: 'center', margin: '0 0 8px 0' }}>
              Michael & Sofia
            </h2>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#2563EB', textAlign: 'center', margin: '0' }}>{text.financeText}</p>
          </div>

          {/* Main Display Area */}
          <div style={{ width: '72%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Scrollable View Panel */}
            <div id="analysis-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {currentView === "analysis" && (
                <>
                  {stockOfTheDay && !analysisData && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>⭐</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400E' }}>{text.stockOfDay}</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#D97706' }}>{stockOfTheDay.symbol} - {stockOfTheDay.name}</div>
                          {stockOfTheDay.price && <div style={{ fontSize: '12px', color: '#B45309' }}>Price: {stockOfTheDay.price}</div>}
                        </div>
                      </div>
                      <button onClick={analyzeStockOfTheDay} style={{ backgroundColor: '#D97706', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{text.analyze}</button>
                    </div>
                  )}

                  {/* Main AI Assistant Block */}
                  <AIResearchAssistant
                    langKey={language}
                    user={user}
                    profile={profile}
                    onUpgradePlan={() => setCurrentView('pricing')}
                    placeholderText={enableAIEnhancement ? text.inputPlaceholderEnabled : text.inputPlaceholderDisabled}
                    promptNotice={!enableAIEnhancement ? text.checkAiPrompt : undefined}
                  />

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

            {/* Bottom Controls Panel */}
            <div style={{ backgroundColor: 'white', padding: '12px 20px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '8px' }}>{text.inputLabel}</p>
              
              {/* Row with Voice Provider Button (Left) & Shrunken 50% Watchlist (Right) */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px', marginBottom: '12px' }}>
                <button 
                  onClick={() => setShowVoiceProvider(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 16px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {text.voiceProviderBtn}
                </button>

                {user && (
                  <div style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '8px 12px', border: '1px solid #FDE68A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#D97706' }}>{text.myWatchlist}</span>
                      <button
                        onClick={() => {
                          const watchlist = getWatchlist();
                          if (watchlist.length === 0) {
                            alert(text.noWatchlist);
                          }
                        }}
                        style={{ fontSize: '10px', color: '#92400E', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {text.refresh}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(() => {
                        const watchlist = getWatchlist();
                        if (watchlist.length === 0) {
                          return <span style={{ fontSize: '10px', color: '#92400E' }}>{text.noWatchlist}</span>;
                        }
                        return watchlist.map((symbol: string) => (
                          <button
                            key={symbol}
                            onClick={() => handleAnalyzeRequest(symbol, [], false)}
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#FDE68A',
                              color: '#92400E',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            {symbol}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
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
            <div style={{ backgroundColor: 'white', padding: '8px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.disclaimer}</button>
              <button onClick={() => setLegalTitle('條款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.terms}</button>
              <button onClick={() => setLegalTitle('隱私')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.privacy}</button>
              <button onClick={() => setLegalTitle('退款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.refund}</button>
              <button onClick={() => setLegalTitle('聯絡')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.contact}</button>
            </div>
          </div>
        </div>

        {/* Voice Provider Modal */}
        <VoiceProviderModal
          isOpen={showVoiceProvider}
          onClose={() => setShowVoiceProvider(false)}
          user={user}
          profile={profile}
          onUpgradePlan={() => setCurrentView('pricing')}
          langKey={language}
        />

        <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={() => setIsMenuOpen(false)} langKey={language} />
        
        {isAuthOpen && !user && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} langKey={language} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}