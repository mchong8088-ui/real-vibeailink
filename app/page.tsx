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

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  // Set mounted AFTER component mounts (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
    // Detect mobile after mount
    const ua = window.navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 1024;
    let detectedOS = "Standard OS";
    if (ua.indexOf("Win") !== -1) detectedOS = "Windows";
    if (ua.indexOf("Mac") !== -1) detectedOS = "MacOS";
    setSystemState({ os: detectedOS, isMobile: isMobileDevice });
  }, []);

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      if (supabase && supabase.auth) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
        } else {
          console.log("Successfully signed out from Supabase");
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Force reload to home page
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
      console.log("🔵 Analyzing ticker:", ticker, "Current language:", language);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: ticker,
          language: language
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ API Response received, language requested:", language);
      
      setAnalysisData({
        success: data.success,
        symbol: data.symbol || ticker.toUpperCase(),
        price: data.price || "N/A",
        change: data.change,
        changePercent: data.changePercent,
        rsi: data.rsi || "N/A",
        macd: data.macd || "N/A",
        marketCap: data.marketCap || "N/A",
        peRatio: data.peRatio || "N/A",
        volume: data.volume || "N/A",
        high52w: data.high52w || "N/A",
        low52w: data.low52w || "N/A",
        avgVolume: data.avgVolume || "N/A",
        historical: data.historical || [],
        summary: data.summary || data.text || `Analysis for ${ticker.toUpperCase()} completed.`,
        text: data.text || data.summary || `Analysis for ${ticker.toUpperCase()} completed.`,
      });
      
    } catch (error) {
      console.error('❌ Error fetching analysis:', error);
      setAnalysisData({
        symbol: ticker.toUpperCase(),
        price: "N/A",
        rsi: "N/A",
        macd: "N/A",
        marketCap: "N/A",
        peRatio: "N/A",
        volume: "N/A",
        summary: `Unable to fetch analysis for ${ticker.toUpperCase()}. Please try again.`,
        text: `Unable to fetch analysis for ${ticker.toUpperCase()}. Please try again.`,
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

  const showLegalGate = user && profile && profile.has_accepted_legal === false;
  const showMasterPopup = isAuthOpen || legalTitle || showLegalGate;

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name.substring(0, 10);
    if (user?.email) return user.email.split('@')[0].substring(0, 10);
    return 'User';
  };

  // Don't render anything until mounted - this prevents hydration mismatch
  if (!mounted) {
    return null;
  }

  // DESKTOP VIEW
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white">
      
      {/* HEADER */}
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
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 12px',
                textTransform: 'uppercase',
              }}
            >
              {view === 'analysis' ? t('aiStock') : t(view)}
            </button>
          ))}
        </div>
        <div className="w-1/4 flex items-center justify-end gap-3">
          {user ? (
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium max-w-[100px] truncate">{getUserDisplayName()}</span>
              <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)} 
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                color: '#2563EB',
                fontWeight: '700',
                fontSize: '12px',
              }}
            >
              {t('login')}
            </button>
          )}
          <LanguageToggle currentLang={language} onLangChange={(lang: string) => setLanguage(lang as any)} />
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden" style={{ height: '92vh' }}>
        
        {/* LEFT PANEL - Yellow background */}
        <aside className="w-[20%] bg-[#FEF08A] flex flex-col items-center justify-center p-3">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-3 bg-white shadow-lg">
            <img src="/avatars/michael_teresa.jpg" className="w-full h-full object-cover" alt="Michael & Teresa" />
          </div>
          <h3 className="font-black text-slate-900 text-xl uppercase text-center leading-tight">Michael & Teresa</h3>
          <p className="text-[10px] font-black text-blue-700 tracking-[0.15em] mt-1 uppercase text-center">
            {t('financeMarketAnalysis')}
          </p>
          <p className="text-[9px] font-bold text-slate-500 tracking-wide mt-1 text-center">
            {systemState.os} {t('environmentActive')}
          </p>
        </aside>

        {/* RIGHT PANEL - Light blue background */}
        <div className="w-[80%] bg-[#E0F2FE] flex flex-col overflow-hidden">
          
          {/* SCROLLABLE CONTENT AREA */}
          <div id="meat-scroll-area" className="flex-1 overflow-y-auto px-[5%] pt-4 pb-4 scrollbar-hide min-h-0">
            <div className="max-w-full mx-auto">
              
              {showUserMenu && (
                <UserMenu 
                  user={user} 
                  profile={profile} 
                  onLogout={handleLogout} 
                  onOpenPricingPage={() => { 
                    setCurrentView("pricing"); 
                    setPricingContext('normal'); 
                    setShowPricingModal(true); 
                    setShowUserMenu(false); 
                  }}
                  onSelectPlan={handleSelectPlan} 
                  onClose={() => setShowUserMenu(false)} 
                />
              )}

              {(showMasterPopup || legalTitle) && (
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mb-6">
                  <button 
                    onClick={() => { 
                      setIsAuthOpen(false); 
                      setLegalTitle(null); 
                      setShowPricingModal(false); 
                    }} 
                    className="float-right text-red-500 font-bold text-sm uppercase hover:text-red-700 mb-3"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Close ✕
                  </button>
                  <div className="clear-both">
                    {isAuthOpen && !user && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
                    {showLegalGate && <LegalGate language={language} onAccept={() => initializeNewUser("Guest", "guest@vibeailink.com")} />}
                    {legalTitle && (
                      <div>
                        <h2 className="text-2xl font-black mb-5 text-blue-600 uppercase tracking-wide">{legalTitle}</h2>
                        <div className="text-base text-slate-700 whitespace-pre-wrap leading-relaxed">
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

          {/* INPUT AREA */}
          <div className="bg-white shadow-lg flex-shrink-0" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '5%', paddingRight: '5%' }}>
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
          <div className="bg-white flex-shrink-0 py-2">
            <div className="px-[5%]">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { 
                    setLegalTitle('DISCLAIMER'); 
                    const meatArea = document.getElementById('meat-scroll-area'); 
                    if (meatArea) meatArea.scrollTop = 0; 
                  }} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: legalTitle === 'DISCLAIMER' ? '#2563EB' : '#3B82F6', 
                    fontWeight: legalTitle === 'DISCLAIMER' ? '900' : '500', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: '4px 8px' 
                  }}
                >
                  {t('disclaimer')}
                </button>
                <button 
                  onClick={() => { 
                    setLegalTitle('服務條款'); 
                    const meatArea = document.getElementById('meat-scroll-area'); 
                    if (meatArea) meatArea.scrollTop = 0; 
                  }} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: legalTitle === '服務條款' ? '#2563EB' : '#3B82F6', 
                    fontWeight: legalTitle === '服務條款' ? '900' : '500', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: '4px 8px' 
                  }}
                >
                  {t('termsOfService')}
                </button>
                <button 
                  onClick={() => { 
                    setLegalTitle('隱私政策'); 
                    const meatArea = document.getElementById('meat-scroll-area'); 
                    if (meatArea) meatArea.scrollTop = 0; 
                  }} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: legalTitle === '隱私政策' ? '#2563EB' : '#3B82F6', 
                    fontWeight: legalTitle === '隱私政策' ? '900' : '500', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: '4px 8px' 
                  }}
                >
                  {t('privacyPolicy')}
                </button>
                <button 
                  onClick={() => { 
                    setLegalTitle('退款政策'); 
                    const meatArea = document.getElementById('meat-scroll-area'); 
                    if (meatArea) meatArea.scrollTop = 0; 
                  }} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: legalTitle === '退款政策' ? '#2563EB' : '#3B82F6', 
                    fontWeight: legalTitle === '退款政策' ? '900' : '500', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: '4px 8px' 
                  }}
                >
                  {t('refundPolicy')}
                </button>
                <button 
                  onClick={() => { 
                    setLegalTitle('聯絡我們'); 
                    const meatArea = document.getElementById('meat-scroll-area'); 
                    if (meatArea) meatArea.scrollTop = 0; 
                  }} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: legalTitle === '聯絡我們' ? '#2563EB' : '#3B82F6', 
                    fontWeight: legalTitle === '聯絡我們' ? '900' : '500', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: '4px 8px' 
                  }}
                >
                  {t('contactUs')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language}/>
    </div>
  );
}