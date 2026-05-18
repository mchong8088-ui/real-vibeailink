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
  const [systemState, setSystemState] = useState({ os: "Detecting...", isMobile: false });
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
    // Improved mobile detection
    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(ua);
    const isSmallScreen = window.innerWidth < 1024;
    const isMobileDevice = isMobileUA || isSmallScreen;
    
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

  // DESKTOP VIEW - Based on working copy with proper left panel
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white">
      
      {/* HEADER - Top fixed bar */}
      <nav className="h-[8vh] bg-white flex items-center justify-between px-8 flex-shrink-0">
        <div className="w-1/4">
          <h1 className="text-2xl font-black italic text-red-600">vibeAiLink</h1>
        </div>
        <div className="flex-1 flex justify-center gap-8">
          {['analysis', 'about', 'features', 'pricing'].map((view) => (
            <button
              key={view}
              onClick={() => { 
                setCurrentView(view as any); 
                setLegalTitle(null);
                const meatArea = document.getElementById('meat-scroll-area');
                if (meatArea) meatArea.scrollTop = 0;
              }}
              style={{
                fontSize: '11px',
                fontWeight: currentView === view && !legalTitle ? '900' : '600',
                letterSpacing: '0.2em',
                color: currentView === view && !legalTitle ? '#2563EB' : '#94A3B8',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                paddingBottom: '4px',
              }}
            >
              {view === 'analysis' ? 'AI STOCK' : view.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="w-1/4 flex items-center justify-end gap-3">
          {user ? (
            <UserMenu 
              user={user} 
              profile={profile} 
              onLogout={handleLogout} 
              onOpenPricingPage={() => {
                setCurrentView("pricing");
                setShowPricingModal(true);
              }} 
              onSelectPlan={handleSelectPlan}
            />
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)} 
              style={{
                color: '#1e293b',
                fontWeight: '700',
                fontSize: '11px',
                backgroundColor: '#F1F5F9',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Login Portal
            </button>
          )}
          <LanguageToggle currentLang={language} onLangChange={(lang: string) => setLanguage(lang as any)} />
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden" style={{ height: '92vh' }}>
        
        {/* LEFT PANEL - Yellow background, fixed */}
        <aside className="w-[20%] bg-[#FEF08A] flex flex-col items-center justify-center p-3">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 bg-white shadow-lg">
            <img 
              src="/avatars/michael_teresa.jpg" 
              className="w-full h-full object-cover" 
              alt="Michael & Teresa"
            />
          </div>
          <h3 className="font-black text-slate-900 text-base uppercase text-center leading-tight">
            Michael & Teresa
          </h3>
          <p className="text-[9px] font-black text-blue-700 tracking-[0.15em] mt-1 uppercase text-center">
            Finance & Market Analysis
          </p>
          <p className="text-[8px] font-bold text-slate-500 tracking-wide mt-1 text-center">
            {systemState.os} Environment Active
          </p>
        </aside>

        {/* RIGHT PANEL - Light Blue background */}
        <div className="w-[80%] bg-[#E0F2FE] flex flex-col overflow-hidden">
          
          {/* SCROLLABLE CONTENT AREA */}
          <div 
            id="meat-scroll-area"
            className="flex-1 overflow-y-auto px-[5%] pt-4 pb-2 scrollbar-hide min-h-0"
          >
            <div className="max-w-full mx-auto">
              
              {/* POPUP WINDOWS */}
              {(showMasterPopup || legalTitle) && (
                <div className="w-full bg-white rounded-xl shadow-lg p-5 mb-4">
                  <button 
                    onClick={() => { 
                      setIsAuthOpen(false); 
                      setLegalTitle(null);
                      setShowPricingModal(false);
                    }} 
                    className="float-right text-red-500 font-black text-xs uppercase hover:text-red-700 mb-2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Close ✕
                  </button>
                  <div className="clear-both">
                    {isAuthOpen && !user && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
                    {showLegalGate && <LegalGate language={language} onAccept={() => initializeNewUser("Guest", "guest@vibeailink.com")} />}
                    {legalTitle && (
                      <div>
                        <h2 className="text-lg font-black mb-3 text-blue-600 uppercase tracking-wide">
                          {legalTitle}
                        </h2>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                          {footerContent[legalTitle]?.[language === "Cantonese" ? "粵語 (繁體中文)" : language] || "Content coming soon..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MAIN CONTENT VIEWS */}
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
                    onClose={() => {
                      setCurrentView("analysis");
                      setShowPricingModal(false);
                    }} 
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

          {/* INPUT AREA - Centered */}
          <div 
            className="bg-white rounded-t-3xl shadow-lg flex-shrink-0"
            style={{ 
              paddingTop: '16px',
              paddingBottom: '16px',
              paddingLeft: '5%',
              paddingRight: '5%',
              minHeight: '120px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
              <SmartInputSystem 
                langKey={language} 
                onAnalyze={handleAnalyzeRequest} 
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo}
                analysisText={analysisData?.summary}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="bg-white flex-shrink-0 py-3">
            <div className="px-[5%]">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '24px',
                flexWrap: 'wrap',
              }}>
                {['DISCLAIMER', '服務條款', '隱私政策', '退款政策', '聯絡我們'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setLegalTitle(tab);
                      const meatArea = document.getElementById('meat-scroll-area');
                      if (meatArea) meatArea.scrollTop = 0;
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: legalTitle === tab ? '#2563EB' : '#3B82F6',
                      fontWeight: legalTitle === tab ? '900' : '500',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Input Popup (+ button) */}
      <SourceMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelectSource={handleSourceSelect} 
        langKey={language} 
      />
    </div>
  );
}