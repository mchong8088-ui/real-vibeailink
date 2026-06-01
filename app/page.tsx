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

export default function VibeAiMaster() {
  const { t, language, setLanguage } = useLanguage();
  
  const [mounted, setMounted] = useState(false);
  const [systemState, setSystemState] = useState({ os: "Detecting...", isMobile: false });
  const [user, setUser] = useState<any>(null);

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

  // Check auth on mount
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

  const handleAnalyzeRequest = async (ticker: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ticker, language }),
      });
      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      setAnalysisData({ symbol: ticker, summary: `Unable to analyze ${ticker}. Please try again.` });
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
    } catch (error) { alert('Unable to process payment.'); }
  };

  const handleSourceSelect = async (sourceType: string, sourceData?: any) => {
    setIsMenuOpen(false);
  };

  const handleMobileNavigate = (page: string, params?: any) => {
    if (page === 'analysis') { setMobilePage('analysis'); setMobileView('analysis'); }
    else if (page === 'content') { setMobilePage('content'); setMobileTopic(params?.view); setMobileLegal(params?.view); }
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
        financeText: '金融與市場分析',
        inputLabel: '請在下方輸入股票代號',
        disclaimer: '免責聲明',
        terms: '服務條款',
        privacy: '隱私政策',
        refund: '退款政策',
        contact: '聯絡我們',
        aiStock: 'AI 股票',
        about: '關於',
        features: '功能',
        pricing: '定價'
      };
    } else if (language === '简体中文') {
      return {
        financeText: '金融与市场分析',
        inputLabel: '请在下方输入股票代码',
        disclaimer: '免责声明',
        terms: '服务条款',
        privacy: '隐私政策',
        refund: '退款政策',
        contact: '联系我们',
        aiStock: 'AI 股票',
        about: '关于',
        features: '功能',
        pricing: '定价'
      };
    } else {
      return {
        financeText: 'Finance & Market Analysis',
        inputLabel: 'Please input stock symbol below',
        disclaimer: 'DISCLAIMER',
        terms: 'TERMS',
        privacy: 'PRIVACY',
        refund: 'REFUND',
        contact: 'CONTACT',
        aiStock: 'AI STOCK',
        about: 'ABOUT',
        features: 'FEATURES',
        pricing: 'PRICING'
      };
    }
  };

  const text = getTranslatedText();

  if (!isHydrated || !mounted) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (systemState.isMobile) {
    if (mobilePage === 'landing') {
      return <MobileLanding langKey={language} setLangKey={setLanguage as any} onAuthOpen={() => setIsAuthOpen(true)} user={user} onNavigate={handleMobileNavigate} />;
    }
    return <MobileAnalysis langKey={language} setLangKey={setLanguage as any} user={user} onAuthOpen={() => setIsAuthOpen(true)} viewType={mobileView} topicId={mobileTopic} legalTitle={mobileLegal} onBack={handleMobileBack} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['analysis', 'about', 'features', 'pricing'].map(v => (
            <button key={v} onClick={() => setCurrentView(v as any)} style={{ fontSize: '13px', fontWeight: currentView === v ? 'bold' : 'normal', color: currentView === v ? '#2563EB' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              {v === 'analysis' ? text.aiStock : text[v as keyof typeof text]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <LanguageToggle currentLang={language} onLangChange={setLanguage as any} />
          {user ? (
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{getUserDisplayName().charAt(0).toUpperCase()}</div>
              <span>{getUserDisplayName()}</span>
            </button>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>LOGIN</button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{ width: '20%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'auto', minWidth: '200px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Teresa" />
          </div>
          <h3 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '14px', textAlign: 'center', margin: '0' }}>Michael & Teresa</h3>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB', textAlign: 'center', marginTop: '8px' }}>{text.financeText}</p>
          <p style={{ fontSize: '9px', color: '#6B7280', textAlign: 'center', marginTop: '8px' }}>{systemState.os} Environment</p>
        </div>

        {/* Right Panel */}
        <div style={{ width: '80%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {currentView === "analysis" && <StockAnalysisModule t={t} data={analysisData} isLoading={isLoading} langKey={language} />}
            {currentView === "pricing" && <PricingModal isOpen={true} onClose={() => setCurrentView("analysis")} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />}
            {currentView === "about" && <AboutSection lang={language} />}
            {currentView === "features" && <FeaturesSection lang={language} />}
          </div>

          {/* Fixed Input Area */}
          <div style={{ backgroundColor: 'white', padding: '12px 20px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
            <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '8px' }}>{text.inputLabel}</p>
            <SmartInputSystem langKey={language} onAnalyze={handleAnalyzeRequest} onPlusClick={() => setIsMenuOpen(true)} systemInfo={systemInfo} analysisText={analysisData?.summary} />
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: 'white', padding: '8px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flexShrink: 0 }}>
            <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '9px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.disclaimer}</button>
            <button onClick={() => setLegalTitle('服務條款')} style={{ fontSize: '9px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.terms}</button>
            <button onClick={() => setLegalTitle('隱私政策')} style={{ fontSize: '9px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.privacy}</button>
            <button onClick={() => setLegalTitle('退款政策')} style={{ fontSize: '9px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.refund}</button>
            <button onClick={() => setLegalTitle('聯絡我們')} style={{ fontSize: '9px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.contact}</button>
          </div>
        </div>
      </div>

      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language}/>
      
      {isAuthOpen && !user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
      )}
    </div>
  );
}
