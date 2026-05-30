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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"analysis" | "about" | "features" | "pricing">("analysis");
  const [legalTitle, setLegalTitle] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingContext, setPricingContext] = useState<'normal' | 'retention'>('normal');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const [mobilePage, setMobilePage] = useState<'landing' | 'analysis' | 'content'>('landing');
  const [mobileView, setMobileView] = useState<string>('analysis');
  const [mobileTopic, setMobileTopic] = useState<string | null>(null);
  const [mobileLegal, setMobileLegal] = useState<string | null>(null);

  const systemInfo = { system: `VibeAI-${systemState.os}`, voiceEngine: "Local Synthesis" };

  useEffect(() => { 
    setIsHydrated(true); 
  }, []);

  useEffect(() => {
    setMounted(true);
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 1024;
    let detectedOS = "Standard OS";
    if (navigator.userAgent.indexOf("Win") !== -1) detectedOS = "Windows";
    if (navigator.userAgent.indexOf("Mac") !== -1) detectedOS = "MacOS";
    setSystemState({ os: detectedOS, isMobile: isMobileDevice });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handleAnalyzeRequest = async (ticker: string, attachmentsList?: any[]) => {
    if (!user) { setIsAuthOpen(true); return; }
    setIsLoading(true);
    
    console.log("🔵 Analyzing ticker:", ticker);
    console.log("📎 Attachments:", attachmentsList);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: ticker,
          language,
          attachments: attachmentsList 
        }),
      });
      const data = await response.json();
      setAnalysisData({
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
      setAnalysisData({ symbol: ticker.toUpperCase(), summary: `Unable to fetch analysis for ${ticker.toUpperCase()}.` });
    } finally { setIsLoading(false); }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    if (!user && planId !== 'explorer') { setIsAuthOpen(true); return; }
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
    if (sourceType === 'url' && sourceData) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ url: sourceData, language }),
      });
      const data = await response.json();
      setAnalysisData((prev: any) => ({ ...prev, summary: prev?.summary + "\n\n📎 " + (data.text || "URL analysis completed.") }));
    }
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

  const showLegalGate = user && profile && profile.has_accepted_legal === false;
  const showMasterPopup = isAuthOpen || legalTitle || showLegalGate;
  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name.substring(0, 10);
    if (user?.email) return user.email.split('@')[0].substring(0, 10);
    return 'User';
  };

  const getTranslatedText = () => {
    if (language === 'Cantonese') {
      return {
        financeText: '金融與市場分析',
        inputLabel: '請在下方輸入股票代號',
        placeholder: '例如: 0700.hk, TSLA 或 2330.TW',
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
        placeholder: '例如: 0700.hk, TSLA 或 2330.TW',
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
        placeholder: 'e.g.: 0700.hk, TSLA or 2330.TW',
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

  if (!mounted || !isHydrated) {
    return null;
  }

  if (systemState.isMobile) {
    if (mobilePage === "landing") {
      return <MobileLanding langKey={language} setLangKey={(lang: string) => setLanguage(lang as any)} onAuthOpen={() => setIsAuthOpen(true)} user={user} onNavigate={handleMobileNavigate} />;
    }
    return <MobileAnalysis langKey={language} setLangKey={(lang: string) => setLanguage(lang as any)} user={user} onAuthOpen={() => setIsAuthOpen(true)} viewType={mobileView} topicId={mobileTopic} legalTitle={mobileLegal as any} onBack={handleMobileBack} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'white', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div><h1 style={{ fontSize: '20px', fontWeight: '900', fontStyle: 'italic', color: '#DC2626', margin: 0 }}>vibeAiLink</h1></div>
          <div style={{ display: 'flex', gap: '48px' }}>
            <button onClick={() => { setCurrentView('analysis'); setLegalTitle(null); }} style={{ fontSize: '13px', fontWeight: currentView === 'analysis' && !legalTitle ? '900' : '500', letterSpacing: '0.1em', color: currentView === 'analysis' && !legalTitle ? '#2563EB' : '#94A3B8', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>{text.aiStock}</button>
            <button onClick={() => { setCurrentView('about'); setLegalTitle(null); }} style={{ fontSize: '13px', fontWeight: currentView === 'about' && !legalTitle ? '900' : '500', letterSpacing: '0.1em', color: currentView === 'about' && !legalTitle ? '#2563EB' : '#94A3B8', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>{text.about}</button>
            <button onClick={() => { setCurrentView('features'); setLegalTitle(null); }} style={{ fontSize: '13px', fontWeight: currentView === 'features' && !legalTitle ? '900' : '500', letterSpacing: '0.1em', color: currentView === 'features' && !legalTitle ? '#2563EB' : '#94A3B8', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>{text.features}</button>
            <button onClick={() => { setCurrentView('pricing'); setLegalTitle(null); }} style={{ fontSize: '13px', fontWeight: currentView === 'pricing' && !legalTitle ? '900' : '500', letterSpacing: '0.1em', color: currentView === 'pricing' && !legalTitle ? '#2563EB' : '#94A3B8', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>{text.pricing}</button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '180px', justifyContent: 'flex-end' }}>
            <LanguageToggle currentLang={language} onLangChange={setLanguage} />
            {user ? <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '20px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{getUserDisplayName().charAt(0).toUpperCase()}</div><span>{getUserDisplayName()}</span></button> : <button onClick={() => setIsAuthOpen(true)} style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>LOGIN</button>}
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '25%', backgroundColor: '#FEF08A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflow: 'auto', minWidth: '220px' }}>
            <div style={{ width: '140px', height: '140px', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
              <img src="/avatars/michael_teresa.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Michael & Teresa" />
            </div>
            <h2 style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '20px', textAlign: 'center', margin: '0 0 8px 0' }}>Michael & Teresa</h2>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#2563EB', textAlign: 'center', margin: '0' }}>{text.financeText}</p>
          </div>
          <div style={{ width: '75%', backgroundColor: '#E0F2FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 5%', minHeight: '200px' }}>
              {showUserMenu && <UserMenu user={user} profile={profile} onLogout={handleLogout} onOpenPricingPage={() => { setCurrentView("pricing"); setShowPricingModal(true); setShowUserMenu(false); }} onSelectPlan={handleSelectPlan} onClose={() => setShowUserMenu(false)} />}
              {(showMasterPopup || legalTitle) && <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}><button onClick={() => { setIsAuthOpen(false); setLegalTitle(null); setShowPricingModal(false); }} style={{ float: 'right', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>Close ✕</button><div style={{ clear: 'both' }}>{isAuthOpen && !user && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}{showLegalGate && <LegalGate language={language} onAccept={() => initializeNewUser("Guest", "guest@vibeailink.com")} />}{legalTitle && <div><h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#2563EB' }}>{legalTitle}</h2><div style={{ fontSize: '13px', color: '#4B5563' }}>{footerContent[legalTitle]?.[language === "Cantonese" ? "粵語 (繁體中文)" : language] || "Content coming soon..."}</div></div>}</div></div>}
              <div>
                {currentView === "analysis" && <StockAnalysisModule t={t} data={analysisData} isLoading={isLoading} langKey={language} />}
                {currentView === "pricing" && <PricingModal isOpen={true} onClose={() => { setCurrentView("analysis"); setShowPricingModal(false); }} user={user} profile={profile} onSelectPlan={handleSelectPlan} showRetentionOnly={pricingContext === 'retention'} />}
                {currentView === "about" && <AboutSection lang={language} />}
                {currentView === "features" && <FeaturesSection lang={language} />}
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '12px 5%', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
              <p style={{ fontSize: '13px', color: '#4B5563', textAlign: 'center', marginBottom: '12px', fontWeight: '500' }}>{text.inputLabel}</p>
              <SmartInputSystem 
                langKey={language} 
                onAnalyze={handleAnalyzeRequest} 
                onPlusClick={() => setIsMenuOpen(true)} 
                systemInfo={systemInfo} 
                analysisText={analysisData?.summary}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
            <div style={{ backgroundColor: 'white', padding: '8px 5%', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setLegalTitle('DISCLAIMER')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.disclaimer}</button>
              <button onClick={() => setLegalTitle('服務條款')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.terms}</button>
              <button onClick={() => setLegalTitle('隱私政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.privacy}</button>
              <button onClick={() => setLegalTitle('退款政策')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.refund}</button>
              <button onClick={() => setLegalTitle('聯絡我們')} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>{text.contact}</button>
            </div>
          </div>
        </div>
      </div>
      <SourceMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onSelectSource={handleSourceSelect} langKey={language}/>
    </div>
  );
}
