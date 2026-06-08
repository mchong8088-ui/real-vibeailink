"use client";
import React, { useState, useRef, useEffect } from 'react';

interface SmartInputSystemProps {
  langKey: string;
  onAnalyze: (ticker: string, attachments?: any[], useAI?: boolean) => void;
  onPlusClick: () => void;
  systemInfo: any;
  analysisText?: string;
  voiceLanguage?: string;  // Add this prop
}

export const SmartInputSystem: React.FC<SmartInputSystemProps> = ({
  langKey,
  onAnalyze,
  onPlusClick,
  systemInfo,
  analysisText,
  voiceLanguage = 'English',  // Default to English
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [useAIEnhancement, setUseAIEnhancement] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Listen for source selections from SourceMenu
  useEffect(() => {
    const handleSourceSelect = (event: CustomEvent) => {
      const { sourceType, sourceData } = event.detail;
      console.log(`📎 Source selected: ${sourceType}`, sourceData);
      
      setAttachments(prev => [...prev, {
        type: sourceType,
        data: sourceData,
        timestamp: Date.now()
      }]);
      
      if (sourceType === 'url') {
        const msg = langKey === 'Cantonese' ? `已添加連結: ${sourceData.substring(0, 50)}...` :
                    langKey === '简体中文' ? `已添加链接: ${sourceData.substring(0, 50)}...` :
                    `Added link: ${sourceData.substring(0, 50)}...`;
        alert(msg);
      } else if (sourceType === 'file' || sourceType === 'photo') {
        const msg = langKey === 'Cantonese' ? `已添加文件: ${sourceData.name}` :
                    langKey === '简体中文' ? `已添加文件: ${sourceData.name}` :
                    `Added file: ${sourceData.name}`;
        alert(msg);
      }
    };

    window.addEventListener('source-select', handleSourceSelect as EventListener);
    return () => {
      window.removeEventListener('source-select', handleSourceSelect as EventListener);
    };
  }, [langKey]);

  // Prepare text for TTS
  const prepareTextForTTS = (text: string): string => {
    let result = text;
    
    result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
    result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    result = result.replace(/[⭐]/g, '');
    result = result.replace(/📈/g, '');
    result = result.replace(/📉/g, '');
    
    if (langKey === 'Cantonese') {
      result = result.replace(/信心評分: (\d+)% 五顆星 \(非常高\)/g, '我比呢隻股信心非常高 $1 個巴仙，同埋五粒星');
      result = result.replace(/信心評分: (\d+)% 四顆星 \(高\)/g, '我比呢隻股信心高 $1 個巴仙，同埋四粒星');
      result = result.replace(/信心評分: (\d+)% 三顆星 \(中等\)/g, '我比呢隻股信心中等 $1 個巴仙，同埋三粒星');
      result = result.replace(/信心評分: (\d+)% 兩顆星 \(低\)/g, '我比呢隻股信心低 $1 個巴仙，同埋兩粒星');
      result = result.replace(/信心評分: (\d+)% 一顆星 \(極低\)/g, '我比呢隻股信心極低 $1 個巴仙，同埋一粒星');
    } else if (langKey === '简体中文') {
      result = result.replace(/信心评分: (\d+)% 五颗星 \(非常高\)/g, '我对这只股票信心非常高 $1 百分之，五颗星');
      result = result.replace(/信心评分: (\d+)% 四颗星 \(高\)/g, '我对这只股票信心高 $1 百分之，四颗星');
      result = result.replace(/信心评分: (\d+)% 三颗星 \(中等\)/g, '我对这只股票信心中等 $1 百分之，三颗星');
      result = result.replace(/信心评分: (\d+)% 两颗星 \(低\)/g, '我对这只股票信心低 $1 百分之，两颗星');
      result = result.replace(/信心评分: (\d+)% 一颗星 \(极低\)/g, '我对这只股票信心极低 $1 百分之，一颗星');
    } else {
      result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, "I rate this stock 5 stars with $1 percent confidence!");
      result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, "I rate this stock 4 stars with $1 percent confidence!");
      result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, "I rate this stock 3 stars with $1 percent confidence.");
      result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, "I rate this stock 2 stars with $1 percent confidence. Be careful.");
      result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, "I rate this stock only 1 star with $1 percent confidence. High risk!");
    }
    
    return result;
  };

  // Auto-speak when analysis data arrives
  useEffect(() => {
    if (analysisText && isSpeaking && !isPaused) {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const textToSpeak = prepareTextForTTS(analysisText);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Use voiceLanguage for the voice
      const voiceLang = voiceLanguage || localStorage.getItem('preferredVoice') || 'English';
      
      // In SmartInputSystem.tsx, update the voice mapping section (around line 120-135):

if (voiceLang === 'Cantonese') {
  utterance.lang = 'zh-HK';
} else if (voiceLang === 'Taiwanese') {
  utterance.lang = 'zh-TW';  // Taiwanese Mandarin
} else if (voiceLang === 'Mandarin') {
  utterance.lang = 'zh-CN';  // Mainland Mandarin
} else {
  utterance.lang = 'en-US';
}
      
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onend = () => { utteranceRef.current = null; };
      utterance.onerror = () => { utteranceRef.current = null; };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    return () => { if (utteranceRef.current) window.speechSynthesis.cancel(); };
  }, [analysisText, isSpeaking, isPaused, voiceLanguage, langKey]);

  const handleMicToggle = () => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    } else if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
  };

  const handleSpeakerToggle = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handlePauseToggle = () => {
    if (!analysisText) return;
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel();
      setIsPaused(true);
    } else if (isPaused && !isSpeaking) {
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      let userContent = null;
      if (attachments.length > 0) {
        const urlAttachment = attachments.find(a => a.type === 'url');
        if (urlAttachment) {
          userContent = urlAttachment.data;
        } else {
          const fileAttachment = attachments.find(a => a.type === 'file' || a.type === 'photo');
          if (fileAttachment && fileAttachment.data.content) {
            userContent = `[File uploaded: ${fileAttachment.data.name}]`;
          }
        }
      }
      
      await onAnalyze(inputValue.trim(), userContent ? [{ content: userContent, type: attachments[0]?.type }] : [], useAIEnhancement);
      
      setAttachments([]);
      setInputValue('');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const getPlaceholder = () => {
    if (langKey === 'Cantonese') return '輸入股票代號 e.g.: 0700.hk, 2330.tw, TSLA';
    if (langKey === '简体中文') return '输入股票代码 e.g.: 0700.hk, 2330.tw, TSLA';
    return 'Enter stock symbol e.g.: 0700.hk, 2330.tw, TSLA';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          setInputValue(event.results[0][0].transcript);
          setIsListening(false);
        };
        
        recognitionInstance.onerror = () => setIsListening(false);
        recognitionInstance.onend = () => setIsListening(false);
        setRecognition(recognitionInstance);
      }
    }
  }, [langKey]);

  const renderButton = (isActive: boolean, onClick: () => void, icon: React.ReactElement, activeColor: string, inactiveColor: string) => {
    return (
      <button onClick={onClick} style={{ flex: 1, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? activeColor : inactiveColor, color: 'white', border: 'none', cursor: 'pointer', position: 'relative' }}>
        {icon}
        {!isActive && (<div style={{ position: 'absolute', top: '50%', left: '50%', width: '2px', height: '24px', backgroundColor: 'white', transform: 'translate(-50%, -50%) rotate(45deg)' }} />)}
      </button>
    );
  };

  const attachmentCount = attachments.length;

  return (
    <div style={{ width: '100%' }}>
      {/* AI Enhancement Toggle */}
      <div style={{ 
        marginBottom: '8px', 
        padding: '6px 12px', 
        backgroundColor: useAIEnhancement ? '#FEF3C7' : '#F3F4F6',
        borderRadius: '8px',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer',
          flex: 1
        }}>
          <input
            type="checkbox"
            checked={useAIEnhancement}
            onChange={(e) => setUseAIEnhancement(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', fontWeight: '500', color: '#374151' }}>
            {langKey === 'Cantonese' ? '🤖 AI增強分析' : 
             langKey === '简体中文' ? '🤖 AI增强分析' : 
             '🤖 AI Enhancement'}
          </span>
          <span style={{ fontSize: '9px', color: '#6B7280' }}>
            {langKey === 'Cantonese' ? '(網關選項)' : 
             langKey === '简体中文' ? '(网关选项)' : 
             '(Gateway option)'}
          </span>
        </label>
        {useAIEnhancement && (
          <div style={{ 
            fontSize: '9px', 
            color: '#D97706', 
            backgroundColor: '#FEF3C7',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {langKey === 'Cantonese' ? '啟用中' : langKey === '简体中文' ? '启用中' : 'Active'}
          </div>
        )}
      </div>
      
      {/* Attachments indicator */}
      {attachmentCount > 0 && (
        <div style={{ 
          marginBottom: '8px', 
          padding: '6px 12px', 
          backgroundColor: '#EFF6FF', 
          borderRadius: '8px',
          fontSize: '11px',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📎</span>
          <span>{attachmentCount} {langKey === 'Cantonese' ? '個附件待分析' : langKey === '简体中文' ? '个附件待分析' : 'attachment(s) ready for analysis'}</span>
          <button 
            onClick={() => setAttachments([])}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={onPlusClick} style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>+</button>
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder={getPlaceholder()} 
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} 
          style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '24px', border: '1px solid #E5E7EB', outline: 'none', minWidth: 0 }} 
        />
        <button 
          onClick={handleSubmit} 
          disabled={!inputValue.trim() || isLoading} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '24px', 
            backgroundColor: (inputValue.trim() && !isLoading) 
              ? (useAIEnhancement ? '#F59E0B' : '#22C55E') 
              : '#D1D5DB', 
            color: 'white', 
            border: 'none', 
            cursor: (inputValue.trim() && !isLoading) ? 'pointer' : 'not-allowed', 
            fontWeight: '500', 
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading 
            ? (useAIEnhancement ? '🤖 分析中...' : '分析中...') 
            : (useAIEnhancement ? '✨ AI分析' : '發送')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        {renderButton(isListening, handleMicToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>, '#3B82F6', '#EF4444')}
        
        {renderButton(isSpeaking, handleSpeakerToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>, '#EF4444', '#9CA3AF')}
        
        {renderButton(isPaused, handlePauseToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, '#EF4444', '#9CA3AF')}
      </div>
    </div>
  );
};