// components/mobile/MobileAnalysis.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LanguageToggle } from '../layout/LanguageToggle';
import { SmartInputSystem } from '../features/controls/SmartInputSystem';
import { SourceMenu } from '../features/controls/SourceMenu';
import { AboutSection } from '../sections/AboutSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { PricingModal } from '../features/pricing/PricingModal';
import { footerContent } from '../../constants/content';

interface MobileAnalysisProps {
  langKey: string;
  setLangKey: (lang: string) => void;
  user: any;
  onAuthOpen: () => void;
  viewType: string;
  topicId?: string;
  legalTitle?: string | null;
  onBack: () => void;
}

const MobileAnalysis: React.FC<MobileAnalysisProps> = ({
  langKey,
  setLangKey,
  user,
  onAuthOpen,
  viewType,
  topicId,
  legalTitle,
  onBack,
}) => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const systemInfo = { system: "Mobile", voiceEngine: "Local Synthesis" };
  const isAnalysisMode = viewType === 'analysis';

  const handleAnalyzeRequest = async (ticker: string) => {
    if (!user) {
      onAuthOpen();
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ticker, language: langKey }),
      });
      const data = await response.json();
      setAnalysisData({
        symbol: ticker.toUpperCase(),
        summary: data.text || data.summary || `Analysis for ${ticker.toUpperCase()} completed.`,
        price: data.price || "N/A",
        rsi: data.rsi || "N/A",
        macd: data.macd || "N/A",
      });
    } catch (error) {
      console.error('Error:', error);
      setAnalysisData({
        symbol: ticker.toUpperCase(),
        summary: `Unable to fetch analysis for ${ticker.toUpperCase()}. Please try again.`,
        price: "N/A",
        rsi: "N/A",
        macd: "N/A",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string) => {
    console.log('Selected plan:', planId, priceId);
  };

  const handleSourceSelect = (sourceType: string, sourceData?: any) => {
    if (sourceType === 'url' && sourceData) {
      // Handle URL analysis
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceData, language: langKey }),
      }).then(response => response.json())
        .then(data => {
          setAnalysisData(prev => ({
            ...prev,
            summary: prev?.summary + "\n\n📎 URL Analysis:\n" + (data.text || "URL analysis completed.")
          }));
        });
    } else if (sourceType === 'camera' || sourceType === 'file') {
      alert(`${sourceType} feature coming soon!`);
    }
  };

  const getTitle = () => {
    if (legalTitle) return legalTitle;
    if (topicId === 'about') return langKey === 'Cantonese' ? '關於我們' : 'About';
    if (topicId === 'features') return langKey === 'Cantonese' ? '功能介紹' : 'Features';
    if (topicId === 'pricing') return langKey === 'Cantonese' ? '服務定價' : 'Pricing';
    return langKey === 'Cantonese' ? 'AI 分析' : 'AI Analysis';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100%', 
      backgroundColor: '#f5f5f5', 
      overflow: 'hidden' 
    }}>
      
      {/* TOP BAR */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '12px 16px', 
        borderBottom: '1px solid #E5E7EB', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexShrink: 0 
      }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>{getTitle()}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <LanguageToggle currentLang={langKey} onLangChange={setLangKey} />
          <button onClick={onAuthOpen} style={{ color: '#2563EB', fontWeight: '600', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {user ? 'Welcome' : (langKey === 'Cantonese' ? '登入' : 'Login')}
          </button>
        </div>
      </div>

      {/* OUTPUT AREA - Scrollable */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '12px',
        backgroundColor: '#F9FAFB'
      }}>
        
        {legalTitle && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#4B5563' }}>
              {footerContent[legalTitle]?.[langKey === "Cantonese" ? "粵語 (繁體中文)" : langKey] || "Content coming soon..."}
            </div>
          </div>
        )}

        {topicId === 'pricing' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px' }}>
            <PricingModal isOpen={true} onClose={onBack} user={user} profile={null} onSelectPlan={handleSelectPlan} showRetentionOnly={false} />
          </div>
        )}

        {topicId === 'about' && <AboutSection lang={langKey} />}
        {topicId === 'features' && <FeaturesSection lang={langKey} />}

        {isAnalysisMode && !legalTitle && (
          <>
            {isLoading ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: '28px', height: '28px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>Analyzing market...</p>
              </div>
            ) : !analysisData || !analysisData.symbol ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>{langKey === 'Cantonese' ? '請輸入股票代號' : 'Please enter stock symbol'}</p>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', textAlign: 'center' }}>{analysisData.symbol}</h2>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>Price</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>{analysisData.price}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>RSI</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6' }}>{analysisData.rsi}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#9CA3AF' }}>MACD</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981' }}>{analysisData.macd}</p>
                  </div>
                </div>
                
                {analysisData.summary && (
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{analysisData.summary}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* FIXED INPUT BAR - Uses SmartInputSystem which already has + button */}
      {isAnalysisMode && !legalTitle && (
        <div style={{ 
          backgroundColor: 'white', 
          borderTop: '1px solid #E5E7EB', 
          padding: '10px 12px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          flexShrink: 0 
        }}>
          <SmartInputSystem 
            langKey={langKey}
            onAnalyze={handleAnalyzeRequest}
            onPlusClick={() => setIsMenuOpen(true)}
            systemInfo={systemInfo}
            analysisText={analysisData?.summary}
          />
        </div>
      )}

      {/* Professional Input Menu - Uses existing SourceMenu component */}
      <SourceMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectSource={handleSourceSelect}
        langKey={langKey}
      />
    </div>
  );
};

export default MobileAnalysis;