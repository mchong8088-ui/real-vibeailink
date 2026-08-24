"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Volume2, VolumeX, Download, Mic, X, AlertCircle, Coffee } from 'lucide-react';

interface AIResearchAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  langKey: string;
  user: any;
  profile: any;
  onUpgradePlan?: () => void;
  onOpenVoiceModalWithScript?: (scriptText: string) => void;
}

export const AIResearchAssistantModal: React.FC<AIResearchAssistantModalProps> = ({
  isOpen,
  onClose,
  langKey,
  user,
  profile,
  onUpgradePlan,
  onOpenVoiceModalWithScript,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isExportingMP3, setIsExportingMP3] = useState(false);
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = langKey === 'Traditional Chinese' || langKey === 'Cantonese' || langKey === 'Taiwanese'
          ? 'zh-TW'
          : langKey === 'Simplified Chinese'
          ? 'zh-CN'
          : 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          // Auto-send after voice input
          setTimeout(() => {
            handleSend(transcript);
          }, 300);
        };
        
        recognitionInstance.onerror = () => {
          setIsListening(false);
        };
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        setRecognition(recognitionInstance);
      }
    }
  }, [langKey]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input.trim();
    if (!textToSend) return;

    if (!user) {
      alert(langKey === 'Simplified Chinese' ? "请先登录" : "請先登入");
      return;
    }

    if (userCredits < 10) {
      alert(langKey === 'Simplified Chinese' 
        ? "您的积分少于 10，请补充积分。" 
        : "您的積分少於 10，請補充積分。");
      if (onUpgradePlan) onUpgradePlan();
      return;
    }

    if (!canExecute) {
      if (onUpgradePlan) onUpgradePlan();
      return;
    }

    const userMessage = textToSend;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, language: langKey, userId: user?.id }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Request failed.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        try {
          recognition.start();
          setIsListening(true);
        } catch (error) {
          console.error('Speech recognition error:', error);
          alert('Unable to start voice input. Please try again.');
        }
      }
    } else {
      alert('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };

  const userCredits = profile?.credits || 0;
  const isSubscriber = Boolean(profile?.subscription_plan && profile.subscription_plan !== 'Free Explorer');
  const hasEnoughCredits = userCredits >= 100;
  const canExecute = isSubscriber || hasEnoughCredits;

  const getNoticeText = () => {
    if (langKey === 'Traditional Chinese' || langKey === 'Cantonese' || langKey === 'Taiwanese') {
      return "此進階功能僅供付費計劃用戶（包括咖啡計劃）或擁有 100 以上積分之用戶使用。想體驗此功能之用戶可以選擇最低門檻「請我飲咖啡」（$5 港幣/美金獲得 100 積分）。";
    } else if (langKey === 'Simplified Chinese') {
      return "此高级功能仅供付费计划用户（包括咖啡计划）或拥有 100 以上积分之用户使用。想体验此功能之用户可以选择最低门槛“请我喝咖啡”（$5 获得 100 积分）。";
    } else {
      return "This advanced feature is for plan users (including coffee plan) or users with over 100 credits only. Anyone who wants to try this feature can 'Buy me a coffee' ($5 for 100 credits) as minimum.";
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      paddingTop: '60px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '24px',
        paddingTop: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        position: 'relative'
      }}>
        {/* Header - Fixed with sticky close button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 10,
          paddingBottom: '12px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="#10B981" size={20} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              🤖 AI Assistant
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#374151',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              fontSize: '20px',
              fontWeight: 'bold'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Notice Banner */}
        <div style={{
          backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px',
          padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px'
        }}>
          <AlertCircle color="#059669" size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: '#065F46', lineHeight: '1.4' }}>
            {getNoticeText()}
            {!canExecute && onUpgradePlan && (
              <button 
                onClick={onUpgradePlan}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  marginLeft: '8px', padding: '2px 8px', borderRadius: '4px',
                  backgroundColor: '#10B981', color: 'white', border: 'none',
                  fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                <Coffee size={12} /> Buy me a coffee ($5)
              </button>
            )}
          </div>
        </div>

        {/* Message Log */}
        <div style={{
          height: '260px', overflowY: 'auto', backgroundColor: '#F9FAFB',
          borderRadius: '10px', padding: '12px', marginBottom: '12px', border: '1px solid #E5E7EB'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', paddingTop: '80px' }}>
              Ask any question or generate research analysis...
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '8px'
            }}>
              <div style={{
                maxWidth: '85%', padding: '8px 12px', borderRadius: '10px',
                backgroundColor: msg.role === 'user' ? '#10B981' : 'white',
                color: msg.role === 'user' ? 'white' : '#1F2937',
                fontSize: '12px', border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}>
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {/* Input Control with Voice Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "🎤 Listening..." : "Type stock ticker, strategy, or market questions..."}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px',
              border: '1px solid #D1D5DB', fontSize: '12px', outline: 'none',
              backgroundColor: isListening ? '#FEF3C7' : '#FFFFFF'
            }}
          />
          
          {/* Voice Input Button */}
          <button
            onClick={handleMicToggle}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isListening ? '#EF4444' : '#3B82F6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              transition: 'all 0.2s ease',
              boxShadow: isListening ? '0 0 0 4px rgba(239, 68, 68, 0.3)' : 'none',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
            aria-label="Voice input"
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <Mic size={18} />
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: (isLoading || !input.trim()) ? '#9CA3AF' : '#10B981',
              color: 'white', border: 'none', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Voice Input Status */}
        {isListening && (
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'blink 1s infinite' }} />
            Listening... Speak your question
          </div>
        )}

        {/* Styles for animations */}
        <style>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};