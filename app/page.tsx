"use client";
import React, { useState, useEffect } from 'react'; 
import { SourceMenu } from './components/features/controls/SourceMenu';
import { SmartInputSystem } from './components/features/controls/SmartInputSystem';
import { StockAnalysisModule } from './components/features/stock-analysis/StockAnalysisModule';
import { PortfolioModule } from './components/features/portfolio/PortfolioModule';
import { AuthModal } from './components/modals/AuthModal';
import { LanguageToggle } from './components/layout/LanguageToggle'; 
import { AboutSection } from './components/sections/AboutSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingModal } from './components/features/pricing/PricingModal';
import MobileLanding from './components/mobile/MobileLanding';
import MobileAnalysis from './components/mobile/MobileAnalysis';
import { supabase } from './lib/supabase';
import { useLanguage } from './context/LanguageContext';

// Error Boundary Component
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
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"analysis" | "portfolio" | "about" | "features" | "pricing">("analysis");
  const [legalTitle, setLegalTitle] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [mobilePage, setMobilePage] = useState<'landing' | 'analysis' | 'content'>('landing');
  const [mobileView, setMobileView] = useState<string>('analysis');
  const [mobileTopic, setMobileTopic] = useState<string | null>(null);
  const [mobileLegal, setMobileLegal] = useState<string | null>(null);

  // Stock of the Day state
  const [stockOfTheDay, setStockOfTheDay] = useState<any>(null);
  const [loadingStockOfDay, setLoadingStockOfDay] = useState(false);

  // Auto-post state (Admin only)
  const [autoPostStatus, setAutoPostStatus] = useState<any>(null);
  const [autoPostLoading, setAutoPostLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  // Admin check using environment variable
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  // Auth effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email);
      setUser(session?.user || null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session?.user?.email);
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Hydration effect
  useEffect(() => { 
    setIsHydrated(true); 
  }, []);

  // System detection effect
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

  const triggerAutoPost = async (platforms: string[] = ['facebook']) => {
    setAutoPostLoading(true);
    try {
      const response = await fetch('/api/social/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'English',
          platforms: platforms,
          testMode: false,
        }),
      });
      const data = await response.json();
      setAutoPostStatus(data);
      alert(`Auto-post completed: ${data.results?.length || 0} stocks posted`);
    } catch (error) {
      console.error('Auto-post failed:', error);
      alert('Auto-post failed.');
    } finally {
      setAutoPostLoading(false);
      setTimeout(() => setAutoPostStatus(null), 5000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const handleAnalyzeRequest = async (ticker: string, attachments?: any[], useAI?: boolean) => {
    setIsLoading(true);
    try {
      let userContent = null;
      if (attachments && attachments.length > 0) {
        const attachment = attachments[0];
        if (attachment.content) {
          userContent = attachment.content;
        }
      }
      
      const endpoint = useAI ? '/api/chat/ai-enhanced' : '/api/chat';
      
      console.log(`📡 Calling endpoint: ${endpoint}, AI: ${useAI}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: ticker, 
          language: language,
          userContent: userContent,
          useAI: useAI || false
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
      setAnalysisData({ 
        symbol: ticker, 
        summary: language === 'Cantonese' ? `無法分析 ${ticker}，請稍後再試。` :
                  language === '简体中文' ? `无法分析 ${ticker}，请稍后再试。` :
                  `Unable to analyze ${ticker}. Please try again.` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId, userId: user?.id, successUrl: `${window.location.origin}/success`, cancelUrl: window.location.href }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) { 
      alert('Unable to process payment.'); 
    }
  };

  const handleSourceSelect = async (sourceType: string, sourceData?: any) => {
    setIsMenuOpen(false);
  };

  const handleMobileNavigate = (page: string, params?: any) => {
    if (page === 'analysis') { 
      setMobilePage('analysis'); 
      setMobileView('analysis'); 
    } else if (page === 'content') { 
      setMobilePage('content'); 
      setMobileTopic(params?.view); 
      setMobileLegal(params?.view); 
    }
  };

  const handleMobileBack = () => {
    setMobilePage('landing');
    setMobileView('analysis');
    setMobileTopic(null);
    setMobileLegal(null);
  };

  const getUserDisplayName = () => {
    if (user?.email) return user.email.split('@')[0].substring(0, 10);
    return 'User';
  };

  const getTranslatedText = () => {
    if (language === 'Cantonese') {
      return {
        financeText: '您的財務及市場分析師',
        inputLabel: '請在下方輸入股票代號',
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
        welcome: '歡迎',
        stockOfDay: '今日精選股票',
        analyze: '分析',
        adminPanel: '管理員面板',
        autoPost: '自動發文',
        postToFacebook: '發文到 Facebook',
        posting: '發文中...',
      };
    } else if (language === '简体中文') {
      return {
        financeText: '您的财务及市场分析师',
        inputLabel: '请在下方输入股票代码',
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
        welcome: '欢迎',
        stockOfDay: '今日精选股票',
        analyze: '分析',
        adminPanel: '管理员面板',
        autoPost: '自动发文',
        postToFacebook: '发文到 Facebook',
        posting: '发文中...',
      };
    } else {
      return {
        financeText: 'Your Finance & Market Analysts',
        inputLabel: 'Please input stock symbol below',
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
        welcome: 'Welcome',
        stockOfDay: '⭐ Stock of the Day',
        analyze: 'Analyze',
        adminPanel: 'Admin Panel',
        autoPost: 'Auto-Post',
        postToFacebook: 'Post to Facebook',
        posting: 'Posting...',
      };
    }
  };

  const text = getTranslatedText();

  // Loading state
  if (!isHydrated || !mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f0f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 16px auto' }} />
          <p>Loading vibeAiLink...</p>
        </div>
      </div>
    );
  }

  // Mobile view
  if (systemState.isMobile) {
    if (mobilePage === 'landing') {
      return (
        <MobileLanding 
          langKey={language} 
          setLangKey={setLanguage as any} 
          onAuthOpen={() => setIsAuthOpen(true)} 
          user={user} 
          onNavigate={handleMobileNavigate} 
        />
      );
    }
    return (
      <MobileAnalysis 
        langKey={language} 
        setLangKey={setLanguage as any} 
        user={user} 
        onAuthOpen={() => setIsAuthOpen(true)} 
        viewType={mobileView} 
        topicId={mobileTopic} 
        legalTitle={mobileLegal} 
        onBack={handleMobileBack} 
      />
    );
  }

  // Desktop view
  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', padding: '16px 32px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
          <div style={{ display: 'flex', gap: '48px' }}>
            {['analysis', 'portfolio', 'about', 'features', 'pricing'].map(v => (
              <button 
                key={v} 
                onClick={() => setCurrentView(v as any)} 
                style={{ 
                  fontSize: '15px', 
                  fontWeight: currentView === v ? 'bold' : 'normal', 
                  color: currentView === v ? '#2563EB' : '#6B7280', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: currentView === v ? '2px solid #2563EB' : 'none'
                }}
              >
                {v === 'analysis' ? text.aiStock : v === 'portfolio' ? text.portfolio : text[v as keyof typeof text]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <LanguageToggle currentLang={language} onLangChange={setLanguage as any} />
            {user ? (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '14px' }}>{getUserDisplayName()}</span>
                </button>
                {showUserMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100 }}>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
                    {isAdmin && (
                      <button onClick={() => setShowAdminPanel(!showAdminPanel)} style={{ padding: '8px 16px', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #E5E7EB', cursor: 'pointer', color: '#D97706' }}>{text.adminPanel}</button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>LOGIN</button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div style={{ width: '28%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflow: 'auto', minWidth: '260px' }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Teresa" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/180x180?text=MT'; }} />
            </div>
            <h2 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '22px', textAlign: 'center', margin: '0 0 8px 0' }}>Michael & Teresa</h2>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#2563EB', textAlign: 'center', margin: '0' }}>{text.financeText}</p>
          </div>

          {/* Right Panel */}
          <div style={{ width: '72%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                  <StockAnalysisModule t={t} data={analysisData} isLoading={isLoading} langKey={language} onAnalyze={handleAnalyzeRequest} />
                </>
              )}
              {currentView === "portfolio" && <PortfolioModule langKey={language} onAnalyzeStock={(symbol) => handleAnalyzeRequest(symbol, [], false)} />}
              {currentView === "pricing" && <PricingModal isOpen={true} onClose={() => setCurrentView("analysis")} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />}
              {currentView === "about" && <AboutSection lang={language} />}
              {currentView === "features" && <FeaturesSection lang={language} />}
            </div>

            <div style={{ backgroundColor: 'white', padding: '12px 20px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '8px' }}>{text.inputLabel}</p>
              <SmartInputSystem langKey={language} onAnalyze={handleAnalyzeRequest} onPlusClick={() => setIsMenuOpen(true)} systemInfo={systemInfo} analysisText={analysisData?.summary} />
            </div>

            <div style={{ backgroundColor: 'white', padding: '8px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.disclaimer}</button>
              <button onClick={() => setLegalTitle('服務條款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.terms}</button>
              <button onClick={() => setLegalTitle('隱私政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.privacy}</button>
              <button onClick={() => setLegalTitle('退款政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.refund}</button>
              <button onClick={() => setLegalTitle('聯絡我們')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.contact}</button>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        {showAdminPanel && isAdmin && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '16px', zIndex: 200, minWidth: '220px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#D97706' }}>{text.adminPanel}</h4>
              <button onClick={() => setShowAdminPanel(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => triggerAutoPost(['facebook'])} disabled={autoPostLoading} style={{ padding: '8px 12px', backgroundColor: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: autoPostLoading ? 0.6 : 1 }}>
                {autoPostLoading ? text.posting : `📘 ${text.postToFacebook}`}
              </button>
              {autoPostStatus && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>✅ Posted: {autoPostStatus.results?.length || 0} stocks</div>}
            </div>
          </div>
        )}

        <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language} />
        
        {isAuthOpen && !user && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}