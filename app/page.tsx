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
    
    // Handle OAuth callback - check for hash fragment
    const handleOAuthRedirect = async () => {
      // Check if we have an access_token in the URL hash (OAuth redirect)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log("🔄 OAuth redirect detected, session will be handled by Supabase");
        // Remove the hash from URL to clean it up
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Wait a moment for Supabase to process the session
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };
    
    handleOAuthRedirect();
    
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const ua = window.navigator.userAgent;
    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(ua);
    const isSmallScreen = window.innerWidth < 1024;
    const isMobileDevice = isLocalhost ? false : (isMobileUA || isSmallScreen);
    
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
    // Check if user is logged in
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    setIsLoading(true);
    setLegalTitle(null);
    
    try {
      console.log("🔵 Analyzing ticker:", ticker, "Language:", language);
      
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

  // DESKTOP VIEW
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      width: '100%',
      backgroundColor: '#f0f0f0',
      overflow: 'hidden'
    }}>
      
      <div style={{ 
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* RESTRICTED AREA 1: TOP BAR */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px 24px', 
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ width: '180px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
          </div>
          <div style={{ display: 'flex', gap: '48px' }}>
            {['analysis', 'about', 'features', 'pricing'].map((view) => (
              <button
                key={view}
                onClick={() => { setCurrentView(view as any); setLegalTitle(null); }}
                style={{
                  fontSize: '13px',
                  fontWeight: currentView === view && !legalTitle ? '900' : '500',
                  letterSpacing: '0.1em',
                  color: currentView === view && !legalTitle ? '#2563EB' : '#94A3B8',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                {view === 'analysis' ? 'AI STOCK' : view.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '180px', justifyContent: 'flex-end' }}>
            <LanguageToggle currentLang={language} onLangChange={(lang: string) => setLanguage(lang as any)} />
            {user ? (
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '12px' }}>{getUserDisplayName()}</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)} 
                style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                LOGIN
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* RESTRICTED AREA 2: LEFT PANEL */}
          <div style={{ 
            width: '20%', 
            backgroundColor: '#FEF08A', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '24px',
            overflow: 'auto'
          }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <img 
                src="/avatars/michael_teresa.jpg" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="Michael & Teresa"
              />
            </div>
            <h3 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '14px', textAlign: 'center', margin: '0' }}>Michael & Teresa</h3>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB', textAlign: 'center', marginTop: '8px' }}>
              Finance & Market Analysis
            </p>
            <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#6B7280', textAlign: 'center', marginTop: '8px' }}>
              {systemState.os} Environment
            </p>
          </div>

          {/* RESTRICTED AREA 3: RIGHT PANEL */}
          <div style={{ 
            width: '80%', 
            backgroundColor: '#E0F2FE', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            
            {/* SCROLLABLE MEAT AREA */}
            <div id="meat-scroll-area" style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px 5% 16px 5%',
              minHeight: '200px'
            }}>
              
              {showUserMenu && (
                <div style={{ marginBottom: '16px' }}>
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
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <button 
                    onClick={() => { setIsAuthOpen(false); setLegalTitle(null); setShowPricingModal(false); }} 
                    style={{ float: 'right', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Close ✕
                  </button>
                  <div style={{ clear: 'both' }}>
                    {isAuthOpen && !user && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
                    {showLegalGate && <LegalGate language={language} onAccept={() => initializeNewUser("Guest", "guest@vibeailink.com")} />}
                    {legalTitle && (
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#2563EB' }}>{legalTitle}</h2>
                        <div style={{ fontSize: '13px', color: '#4B5563' }}>
                          {footerContent[legalTitle]?.[language === "Cantonese" ? "粵語 (繁體中文)" : language] || "Content coming soon..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
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

            {/* FIXED INPUT AREA */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '12px 5%',
              borderTop: '1px solid #E5E7EB',
              flexShrink: 0
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#4B5563', 
                textAlign: 'center', 
                marginBottom: '12px',
                fontWeight: '500'
              }}>
                Please input stock symbol below
              </p>
              <SmartInputSystem 
                langKey={language}
                onAnalyze={handleAnalyzeRequest}
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo}
                analysisText={analysisData?.summary}
              />
            </div>

            {/* RESTRICTED AREA 4: FOOTER */}
            <div style={{ 
              backgroundColor: 'white', 
              padding: '8px 5%',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <button onClick={() => { setLegalTitle('DISCLAIMER'); }} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>DISCLAIMER</button>
              <button onClick={() => { setLegalTitle('服務條款'); }} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>TERMS</button>
              <button onClick={() => { setLegalTitle('隱私政策'); }} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>PRIVACY</button>
              <button onClick={() => { setLegalTitle('退款政策'); }} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>REFUND</button>
              <button onClick={() => { setLegalTitle('聯絡我們'); }} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>CONTACT</button>
            </div>
          </div>
        </div>
      </div>

      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language}/>
    </div>
  );
}
