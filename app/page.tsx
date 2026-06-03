"use client";
import React, { useState, useEffect } from 'react'; 
import { SourceMenu } from './components/features/controls/SourceMenu';
import { SmartInputSystem } from './components/features/controls/SmartInputSystem';
import { StockAnalysisModule } from './components/features/stock-analysis/StockAnalysisModule';
import { AuthModal } from './components/modals/AuthModal';
import { LanguageToggle } from './components/layout/LanguageToggle'; 
import { AboutSection } from './components/sections/AboutSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingModal } from './components/features/pricing/PricingModal';
import MobileLanding from './components/mobile/MobileLanding';
import MobileAnalysis from './components/mobile/MobileAnalysis';
import { supabase } from './lib/supabase';
import { footerContent } from './constants/content';
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
  const [isSpeakerActive, setIsSpeakerActive] = useState(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"analysis" | "about" | "features" | "pricing">("analysis");
  const [legalTitle, setLegalTitle] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [mobilePage, setMobilePage] = useState<'landing' | 'analysis' | 'content'>('landing');
  const [mobileView, setMobileView] = useState<string>('analysis');
  const [mobileTopic, setMobileTopic] = useState<string | null>(null);
  const [mobileLegal, setMobileLegal] = useState<string | null>(null);

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
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
  }, []);

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
    
    // Choose endpoint based on AI enhancement flag
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
    
    // Auto-scroll to analysis
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
        about: '關於',
        features: '功能',
        pricing: '定價',
        welcome: '歡迎'
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
        about: '关于',
        features: '功能',
        pricing: '定价',
        welcome: '欢迎'
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
        about: 'ABOUT',
        features: 'FEATURES',
        pricing: 'PRICING',
        welcome: 'Welcome'
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
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #E5E7EB', 
            borderTopColor: '#2563EB', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <p>Loading vibeAiLink...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
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
            {['analysis', 'about', 'features', 'pricing'].map(v => (
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
                {v === 'analysis' ? text.aiStock : text[v as keyof typeof text]}
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
                    <button onClick={handleLogout} style={{ padding: '8px 16px', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                LOGIN
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel */}
          <div style={{ width: '28%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflow: 'auto', minWidth: '260px' }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img 
                src="/avatars/michael_teresa.jpg" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="Michael & Teresa" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/180x180?text=MT';
                }}
              />
            </div>
            <h2 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '22px', textAlign: 'center', margin: '0 0 8px 0' }}>Michael & Teresa</h2>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#2563EB', textAlign: 'center', margin: '0' }}>{text.financeText}</p>
          </div>

          {/* Right Panel */}
          <div style={{ width: '72%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Scrollable Content */}
            <div id="analysis-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {currentView === "analysis" && (
                <StockAnalysisModule 
                  t={t} 
                  data={analysisData} 
                  isLoading={isLoading} 
                  langKey={language} 
                />
              )}
              {currentView === "pricing" && (
                <PricingModal 
                  isOpen={true} 
                  onClose={() => setCurrentView("analysis")} 
                  user={user} 
                  profile={null} 
                  onSelectPlan={handleSelectPlan} 
                  showRetentionOnly={false} 
                />
              )}
              {currentView === "about" && <AboutSection lang={language} />}
              {currentView === "features" && <FeaturesSection lang={language} />}
            </div>

            {/* Fixed Input Area */}
            <div style={{ backgroundColor: 'white', padding: '12px 20px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '8px' }}>{text.inputLabel}</p>
              <SmartInputSystem 
                langKey={language} 
                onAnalyze={handleAnalyzeRequest} 
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo} 
                analysisText={analysisData?.summary} 
              />
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: 'white', padding: '8px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {text.disclaimer}
              </button>
              <button onClick={() => setLegalTitle('服務條款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {text.terms}
              </button>
              <button onClick={() => setLegalTitle('隱私政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {text.privacy}
              </button>
              <button onClick={() => setLegalTitle('退款政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {text.refund}
              </button>
              <button onClick={() => setLegalTitle('聯絡我們')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
                {text.contact}
              </button>
            </div>
          </div>
        </div>

        <SourceMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          onSelectSource={handleSourceSelect} 
          langKey={language}
        />
        
        {isAuthOpen && !user && (
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
            zIndex: 1000 
          }}>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}