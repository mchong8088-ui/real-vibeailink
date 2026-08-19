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
import UserMenu from './components/auth/UserMenu';
import { supabase } from './lib/supabase';
import { useLanguage } from './context/LanguageContext';
// Import mobile components
import MobileLanding from './components/mobile/MobileLanding';
import MobileAnalysis from './components/mobile/MobileAnalysis';

// ... ErrorBoundary class stays the same ...

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

  // ... rest of your hooks and functions (fetchUserProfile, handleLogout, etc.) stay the same ...
  // Keep all the existing functions: fetchUserProfile, handleLogout, checkCreditsBeforeAnalysis, 
  // handleAnalyzeRequest, handleSelectPlan, getUserDisplayName, getTranslatedText, getWatchlist

  // Add mobile navigation handler
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
      setMobileView('analysis');
      setCurrentView('watchlist');
    } else if (page === 'landing') {
      setMobileView('landing');
    }
  };

  // Handle mobile auth open
  const handleMobileAuthOpen = () => {
    setIsAuthOpen(true);
  };

  // ... keep all your existing functions ...

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
        <MobileLanding
          langKey={language}
          setLangKey={setLanguage}
          onAuthOpen={handleMobileAuthOpen}
          user={user}
          profile={profile}
          onNavigate={handleMobileNavigate}
        />
      );
    }

    if (mobileView === 'analysis') {
      return (
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
      );
    }

    if (mobileView === 'content') {
      return (
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
      );
    }
  }

  // ============================================================
  // DESKTOP RENDER (existing code)
  // ============================================================
  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {/* Header Bar - Keep as is */}
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

        {/* Rest of your desktop content - keep exactly as is */}
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

        {/* Modals - keep as is */}
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

        {showWatchlistModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '16px'
          }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '320px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#059669', fontSize: '14px' }}>{text.myWatchlist}</h4>
                <button onClick={() => setShowWatchlistModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '60px' }}>
                {(() => {
                  const watchlist = getWatchlist();
                  if (watchlist.length === 0) return <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{text.noWatchlist}</span>;
                  return watchlist.map((symbol: string) => (
                    <button
                      key={symbol}
                      onClick={() => { setShowWatchlistModal(false); handleAnalyzeRequest(symbol, [], false); }}
                      style={{ padding: '4px 8px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {symbol}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

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