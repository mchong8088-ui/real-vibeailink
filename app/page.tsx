"use client";
import React, { useState, useEffect } from 'react'; 
import { SourceMenu } from './components/features/controls/SourceMenu';
import { SmartInputSystem } from './components/features/controls/SmartInputSystem';
import { StockAnalysisModule } from './components/features/stock-analysis/StockAnalysisModule';
import { useAuthFlow } from './hooks/useAuthFlow'; 
import UserMenu from './components/auth/UserMenu';
import { AuthModal } from './components/modals/AuthModal';
import { LegalGate } from './components/auth/LegalGate';
import { LanguageToggle } from './components/layout/LanguageToggle'; 
import { AboutSection } from './components/sections/AboutSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingModal } from './components/features/pricing/PricingModal';
import MobileLanding from './components/mobile/MobileLanding';
import MobileAnalysis from './components/mobile/MobileAnalysis';
import { supabase } from './lib/supabase';
import { footerContent } from './constants/content';
import { useLanguage } from './context/LanguageContext';

export default function VibeAiMaster() {
  const { t, language, setLanguage } = useLanguage();
  
  const [mounted, setMounted] = useState(false);
  const [systemState, setSystemState] = useState({ os: "MacOS", isMobile: false });
  const { user, profile, initializeNewUser } = useAuthFlow();

  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"analysis" | "about" | "features" | "pricing">("analysis");
  const [legalTitle, setLegalTitle] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingContext, setPricingContext] = useState<'normal' | 'retention'>('normal');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mobile Navigation States
  const [mobilePage, setMobilePage] = useState<'landing' | 'analysis' | 'content'>('landing');
  const [mobileView, setMobileView] = useState<string>('analysis');
  const [mobileTopic, setMobileTopic] = useState<string | null>(null);
  const [mobileLegal, setMobileLegal] = useState<string | null>(null);

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  useEffect(() => {
    setMounted(true);
    const ua = window.navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 768;
    let detectedOS = "Standard OS";
    if (ua.indexOf("Win") !== -1) detectedOS = "Windows";
    if (ua.indexOf("Mac") !== -1) detectedOS = "MacOS";
    setSystemState({ os: detectedOS, isMobile: isMobileDevice });
  }, []);

  const handleLogout = async () => {
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handleAnalyzeRequest = async (ticker: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    setIsLoading(true);
    setLegalTitle(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ticker, language: language }),
      });
      
      const data = await response.json();
      
      setAnalysisData({
        success: data.success,
        symbol: data.symbol || ticker.toUpperCase(),
        price: data.price || "N/A",
        rsi: data.rsi || "N/A",
        macd: data.macd || "N/A",
        marketCap: data.marketCap || "N/A",
        peRatio: data.peRatio || "N/A",
        volume: data.volume || "N/A",
        historical: data.historical || [],
        summary: data.summary || data.text || `Analysis for ${ticker.toUpperCase()} completed.`,
      });
    } catch (error) {
      console.error('Error:', error);
      setAnalysisData({
        symbol: ticker.toUpperCase(),
        price: "N/A",
        rsi: "N/A",
        macd: "N/A",
        marketCap: "N/A",
        peRatio: "N/A",
        volume: "N/A",
        summary: `Unable to fetch analysis for ${ticker.toUpperCase()}. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    if (!user && planId !== 'explorer') {
      setIsAuthOpen(true);
      return;
    }
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user?.id, successUrl: `${window.location.origin}/success`, cancelUrl: window.location.href }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Unable to process payment.');
    }
  };

  const handleSourceSelect = async (sourceType: string, sourceData?: any) => {
    if (sourceType === 'url' && sourceData) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceData, language: language }),
        });
        const data = await response.json();
        setAnalysisData((prev: any) => ({
          ...prev,
          summary: prev?.summary + "\n\n📎 " + (data.text || "URL analysis completed."),
        }));
      } catch (error) {
        console.error('Error:', error);
      }
    }
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

  const showLegalGate = user && profile && profile.has_accepted_legal === false;
  const showMasterPopup = isAuthOpen || legalTitle || showLegalGate;

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name.substring(0, 10);
    if (user?.email) return user.email.split('@')[0].substring(0, 10);
    return 'User';
  };

  if (!mounted) return null;

  // MOBILE VIEW
  if (systemState.isMobile) {
    if (mobilePage === 'landing') {
      return (
        <MobileLanding 
          langKey={language} 
          setLangKey={setLanguage} 
          onAuthOpen={() => setIsAuthOpen(true)} 
          user={user}
          onNavigate={handleMobileNavigate}
        />
      );
    }
    return (
      <MobileAnalysis
        langKey={language} 
        setLangKey={setLanguage} 
        user={user} 
        onAuthOpen={() => setIsAuthOpen(true)}
        viewType={mobileView} 
        topicId={mobileTopic} 
        legalTitle={mobileLegal}
        onBack={handleMobileBack}
      />
    );
  }

  // DESKTOP VIEW - Compact (fits on one screen)
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      
      {/* TOP BAR - Compact */}
      <div className="h-[10vh] bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="w-1/4">
          <h1 className="text-lg font-black italic text-red-600">vibeAiLink</h1>
        </div>
        <div className="flex-1 flex justify-center gap-6">
          {['analysis', 'about', 'features', 'pricing'].map((view) => (
            <button
              key={view}
              onClick={() => { setCurrentView(view as any); setLegalTitle(null); }}
              className="uppercase tracking-wide text-xs font-semibold transition-colors"
              style={{
                color: currentView === view && !legalTitle ? '#2563EB' : '#94A3B8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {view === 'analysis' ? t('aiStock') : t(view)}
            </button>
          ))}
        </div>
        <div className="w-1/4 flex items-center justify-end gap-3">
          <LanguageToggle currentLang={language} onLangChange={(lang: string) => setLanguage(lang as any)} />
          {user ? (
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">{getUserDisplayName()}</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)} 
              className="text-blue-600 font-semibold text-xs hover:text-blue-800 transition"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL - Compact Yellow */}
        <aside className="w-[18%] bg-[#FEF08A] flex flex-col items-center justify-center p-2">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-white shadow-md">
            <img src="/avatars/michael_teresa.jpg" className="w-full h-full object-cover" alt="Michael & Teresa" />
          </div>
          <h3 className="font-black text-slate-800 text-xs uppercase text-center">Michael & Teresa</h3>
          <p className="text-[8px] font-black text-blue-700 uppercase text-center mt-1">
            {t('financeMarketAnalysis')}
          </p>
          <p className="text-[7px] font-bold text-slate-500 text-center mt-1">
            {systemState.os}
          </p>
        </aside>

        {/* RIGHT PANEL */}
        <div className="w-[82%] bg-[#E0F2FE] flex flex-col overflow-hidden">
          
          {/* SCROLLABLE MEAT AREA */}
          <div id="meat-scroll-area" className="flex-1 overflow-y-auto px-4 pt-2 pb-2 scrollbar-hide">
            <div className="max-w-full mx-auto">
              
              {showUserMenu && (
                <div className="mb-2">
                  <UserMenu 
                    user={user} 
                    profile={profile} 
                    onLogout={handleLogout} 
                    onOpenPricingPage={() => { setCurrentView("pricing"); setShowPricingModal(true); setShowUserMenu(false); }}
                    onSelectPlan={handleSelectPlan} 
                    onClose={() => setShowUserMenu(false)} 
                  />
                </div>
              )}

              {(showMasterPopup || legalTitle) && (
                <div className="w-full bg-white rounded-lg shadow p-3 mb-3">
                  <button 
                    onClick={() => { setIsAuthOpen(false); setLegalTitle(null); setShowPricingModal(false); }} 
                    className="float-right text-red-500 font-bold text-xs hover:text-red-700"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Close ✕
                  </button>
                  <div className="clear-both">
                    {isAuthOpen && !user && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
                    {showLegalGate && <LegalGate language={language} onAccept={() => initializeNewUser("Guest", "guest@vibeailink.com")} />}
                    {legalTitle && (
                      <div>
                        <h2 className="text-lg font-black mb-2 text-blue-600">{legalTitle}</h2>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap">
                          {footerContent[legalTitle]?.[language === "Cantonese" ? "粵語 (繁體中文)" : language] || "Content coming soon..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full">
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
                    onClose={() => { setCurrentView("analysis"); setShowPricingModal(false); }}
                    user={user} 
                    profile={profile} 
                    onSelectPlan={handleSelectPlan} 
                    showRetentionOnly={pricingContext === 'retention'}
                  />
                )}
                {currentView === "about" && <AboutSection lang={language} />}
                {currentView === "features" && <FeaturesSection lang={language} />}
              </div>
            </div>
          </div>

          {/* FIXED INPUT AREA - Compact */}
          <div className="bg-white flex-shrink-0 py-2 px-4">
            <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
              <SmartInputSystem 
                langKey={language}
                onAnalyze={handleAnalyzeRequest}
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo}
                analysisText={analysisData?.summary}
              />
            </div>
          </div>

          {/* FOOTER - Compact */}
          <div className="bg-white flex-shrink-0 py-1 px-4">
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <button onClick={() => { setLegalTitle('DISCLAIMER'); }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: '500', fontSize: '9px', cursor: 'pointer' }}>
                {t('disclaimer')}
              </button>
              <button onClick={() => { setLegalTitle('服務條款'); }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: '500', fontSize: '9px', cursor: 'pointer' }}>
                {t('termsOfService')}
              </button>
              <button onClick={() => { setLegalTitle('隱私政策'); }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: '500', fontSize: '9px', cursor: 'pointer' }}>
                {t('privacyPolicy')}
              </button>
              <button onClick={() => { setLegalTitle('退款政策'); }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: '500', fontSize: '9px', cursor: 'pointer' }}>
                {t('refundPolicy')}
              </button>
              <button onClick={() => { setLegalTitle('聯絡我們'); }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: '500', fontSize: '9px', cursor: 'pointer' }}>
                {t('contactUs')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language}/>
    </div>
  );
}