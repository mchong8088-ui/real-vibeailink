// components/features/controls/SmartInputSystem.tsx
import React, { useState, useEffect, useRef } from 'react';

interface SmartInputSystemProps {
  langKey: string;
  onAnalyze: (ticker: string) => void;
  onPlusClick: () => void;
  systemInfo: any;
  analysisText?: string;
  t?: any;
}

export const SmartInputSystem: React.FC<SmartInputSystemProps> = ({
  langKey,
  onAnalyze,
  onPlusClick,
  systemInfo,
  analysisText,
  t
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [showVoiceWarning, setShowVoiceWarning] = useState(false);

  // Speech Recognition for MIC input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        
        if (langKey === 'Cantonese') {
          recognitionInstance.lang = 'zh-HK';
        } else if (langKey === '简体中文') {
          recognitionInstance.lang = 'zh-CN';
        } else {
          recognitionInstance.lang = 'en-US';
        }
        
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

  // Text-to-Speech for analysis output - with silent fallback
  useEffect(() => {
    if (analysisText && isSpeakerActive && !isPaused) {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(analysisText);
      
      // Set language
      let targetLang = 'en-US';
      if (langKey === 'Cantonese') {
        targetLang = 'zh-HK';
      } else if (langKey === '简体中文') {
        targetLang = 'zh-CN';
      }
      utterance.lang = targetLang;
      utterance.rate = 0.9;
      
      // Silent error handling - no console error
      utterance.onend = () => {
        utteranceRef.current = null;
      };
      
      utterance.onerror = () => {
        // Silently fall back to English without showing error
        if (targetLang !== 'en-US') {
          const fallbackUtterance = new SpeechSynthesisUtterance(analysisText);
          fallbackUtterance.lang = 'en-US';
          fallbackUtterance.rate = 0.9;
          fallbackUtterance.onerror = () => {};
          utteranceRef.current = fallbackUtterance;
          window.speechSynthesis.speak(fallbackUtterance);
          setShowVoiceWarning(true);
          setTimeout(() => setShowVoiceWarning(false), 3000);
        } else {
          utteranceRef.current = null;
        }
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [analysisText, isSpeakerActive, isPaused, langKey]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onAnalyze(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

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
    if (isSpeakerActive) {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
    } else {
      if (analysisText) {
        const utterance = new SpeechSynthesisUtterance(analysisText);
        let targetLang = 'en-US';
        if (langKey === 'Cantonese') {
          targetLang = 'zh-HK';
        } else if (langKey === '简体中文') {
          targetLang = 'zh-CN';
        }
        utterance.lang = targetLang;
        utterance.rate = 0.9;
        utterance.onerror = () => {
          if (targetLang !== 'en-US') {
            const fallback = new SpeechSynthesisUtterance(analysisText);
            fallback.lang = 'en-US';
            utteranceRef.current = fallback;
            window.speechSynthesis.speak(fallback);
          }
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
    setIsSpeakerActive(!isSpeakerActive);
    setIsPaused(false);
  };

  const handlePauseToggle = () => {
    if (!isPaused && isSpeakerActive) {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      setIsPaused(true);
    } else if (isPaused && isSpeakerActive && analysisText) {
      const utterance = new SpeechSynthesisUtterance(analysisText);
      let targetLang = 'en-US';
      if (langKey === 'Cantonese') {
        targetLang = 'zh-HK';
      } else if (langKey === '简体中文') {
        targetLang = 'zh-CN';
      }
      utterance.lang = targetLang;
      utterance.rate = 0.9;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPaused(false);
    }
  };

  const exampleText = t?.stockExample || "e.g.: 0700.hk, TSLA or 2330.TW";
  const listeningText = langKey === 'Cantonese' ? '正在聆聽...' : langKey === '简体中文' ? '正在聆听...' : 'Listening...';

  const buttonStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    flexShrink: 0 as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    position: 'relative' as const,
  };

  const innerStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
  };

  const iconStyle = {
    width: '22px',
    height: '22px',
    color: '#1e293b',
  };

  const crossStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '70%',
    height: '3px',
    backgroundColor: '#1e293b',
    transform: 'translate(-50%, -50%) rotate(45deg)',
    borderRadius: '2px',
    zIndex: 10,
  };

  const listeningStyle = {
    animation: 'pulse 1.5s infinite',
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
        
        <button onClick={onPlusClick} style={{ ...buttonStyle, backgroundColor: '#FACC15', fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>+</button>

        <button onClick={handleMicToggle} style={{ ...buttonStyle, backgroundColor: isListening ? '#3B82F6' : '#EF4444', ...(isListening ? listeningStyle : {}) }}>
          <div style={innerStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </button>

        <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? listeningText : exampleText}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b',
              borderRadius: '24px',
              backgroundColor: isListening ? '#EFF6FF' : 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: 'none',
              outline: 'none',
            }}
          />
        </div>

        <button onClick={handleSpeakerToggle} style={{ ...buttonStyle, backgroundColor: isSpeakerActive ? '#EF4444' : '#9CA3AF' }}>
          <div style={innerStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          {!isSpeakerActive && <div style={crossStyle}></div>}
        </button>

        <button onClick={handlePauseToggle} style={{ ...buttonStyle, backgroundColor: isPaused ? '#9CA3AF' : '#EF4444' }}>
          <div style={innerStyle}>
            {isPaused ? (
              <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          {isPaused && <div style={crossStyle}></div>}
        </button>

        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          style={{ ...buttonStyle, backgroundColor: inputValue.trim() ? '#22C55E' : '#9CA3AF', cursor: inputValue.trim() ? 'pointer' : 'not-allowed' }}
        >
          <div style={{ ...innerStyle, opacity: !inputValue.trim() ? 0.5 : 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10M17 7L7 17" />
            </svg>
          </div>
        </button>
      </div>

      {/* Optional: Subtle voice warning - only shows briefly if needed */}
      {showVoiceWarning && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          backgroundColor: '#FEF08A',
          color: '#854D0E',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '11px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          ⚡ Using English voice (Chinese voice not available)
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};