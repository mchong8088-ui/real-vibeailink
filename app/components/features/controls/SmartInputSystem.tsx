"use client";
import React, { useState, useRef, useEffect } from 'react';

interface Attachment {
  id: string;
  type: 'url' | 'file' | 'photo';
  name: string;
  content?: string;
  preview?: string;
}

interface SmartInputSystemProps {
  langKey: string;
  onAnalyze: (ticker: string, attachments?: Attachment[]) => void;
  onPlusClick: () => void;
  systemInfo: any;
  analysisText?: string;
}

export const SmartInputSystem: React.FC<SmartInputSystemProps> = ({
  langKey,
  onAnalyze,
  onPlusClick,
  systemInfo,
  analysisText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (analysisText && isSpeaking && !isPaused) {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(analysisText);
      utterance.lang = langKey === 'Cantonese' ? 'zh-HK' : langKey === '简体中文' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => { utteranceRef.current = null; setIsSpeaking(false); };
      utterance.onerror = () => { utteranceRef.current = null; setIsSpeaking(false); };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    return () => { if (utteranceRef.current) window.speechSynthesis.cancel(); };
  }, [analysisText, isSpeaking, isPaused, langKey]);

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
    if (!analysisText) return;
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
      setIsSpeaking(false);
    } else if (isPaused && !isSpeaking) {
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handleSubmit = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('message', inputValue);
      formData.append('language', langKey);
      
      // Add URL attachment if present
      const urlAttachment = attachments.find(a => a.type === 'url');
      if (urlAttachment) {
        formData.append('url', urlAttachment.name);
      }
      
      // Add file attachment if present
      const fileAttachment = attachments.find(a => a.type === 'file' || a.type === 'photo');
      if (fileAttachment && fileAttachment.content) {
        // Convert base64 to blob
        const base64 = fileAttachment.content.split(',')[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: 'application/octet-stream' });
        formData.append('file', blob, fileAttachment.name);
      }
      
      const response = await fetch('/api/chat', { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.success) {
        setInputValue('');
        setAttachments([]);
        onAnalyze(data.symbol, []);
      } else {
        alert(data.summary || '分析失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失敗，請檢查網絡連接');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (langKey === 'Cantonese') return '輸入股票代號 e.g.: 0700.hk, TSLA';
    if (langKey === '简体中文') return '输入股票代码 e.g.: 0700.hk, TSLA';
    return 'Enter stock symbol e.g.: 0700.hk, TSLA';
  };

  const renderButtonWithCross = (isActive: boolean, onClick: () => void, icon: React.ReactElement, color: string, inactiveColor: string) => {
    const bgColor = isActive ? color : inactiveColor;
    return (
      <button onClick={onClick} style={{ flex: 1, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, color: 'white', border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        {icon}
        {!isActive && (<div style={{ position: 'absolute', top: '50%', left: '50%', width: '2px', height: '24px', backgroundColor: 'white', transform: 'translate(-50%, -50%) rotate(45deg)', borderRadius: '1px' }} />)}
      </button>
    );
  };

  // Listen for source select events from SourceMenu
  useEffect(() => {
    const handleSourceSelect = (event: CustomEvent) => {
      const { sourceType, sourceData } = event.detail;
      if (sourceType === 'url' && sourceData) {
        setAttachments(prev => [...prev, {
          id: Date.now().toString(),
          type: 'url',
          name: sourceData,
        }]);
      } else if (sourceType === 'file' && sourceData) {
        setAttachments(prev => [...prev, {
          id: Date.now().toString(),
          type: 'file',
          name: sourceData.name,
          content: sourceData.content,
        }]);
      } else if (sourceType === 'photo' && sourceData) {
        setAttachments(prev => [...prev, {
          id: Date.now().toString(),
          type: 'photo',
          name: sourceData.name,
          content: sourceData.content,
          preview: sourceData.content,
        }]);
      }
    };
    window.addEventListener('source-select', handleSourceSelect as EventListener);
    return () => window.removeEventListener('source-select', handleSourceSelect as EventListener);
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          {attachments.map((att) => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}>
              <span>{att.type === 'url' ? '🔗' : att.type === 'file' ? '📄' : '📷'}</span>
              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name.length > 30 ? att.name.substring(0, 30) + '...' : att.name}</span>
              <button onClick={() => removeAttachment(att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', padding: '0 4px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={onPlusClick} style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', flexShrink: 0 }}>+</button>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={getPlaceholder()} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSubmit()} style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1F2937', backgroundColor: '#F3F4F6', borderRadius: '24px', border: '1px solid #E5E7EB', outline: 'none', minWidth: 0 }} disabled={isLoading} />
        <button onClick={handleSubmit} disabled={(!inputValue.trim() && attachments.length === 0) || isLoading} style={{ padding: '10px 20px', borderRadius: '24px', backgroundColor: ((inputValue.trim() || attachments.length > 0) && !isLoading) ? '#22C55E' : '#D1D5DB', color: 'white', border: 'none', cursor: ((inputValue.trim() || attachments.length > 0) && !isLoading) ? 'pointer' : 'not-allowed', fontWeight: '500', fontSize: '14px' }}>
          {isLoading ? '分析中...' : 'Send'}
        </button>
      </div>

      {/* Control Buttons Row */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        {renderButtonWithCross(isListening, handleMicToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>, '#3B82F6', '#EF4444')}
        
        {renderButtonWithCross(isSpeaking, handleSpeakerToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>, '#EF4444', '#9CA3AF')}
        
        {renderButtonWithCross(isPaused, handlePauseToggle, 
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>, '#EF4444', '#9CA3AF')}
      </div>
    </div>
  );
};
