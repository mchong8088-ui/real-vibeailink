"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Volume2, VolumeX, Mic, X, AlertCircle, Coffee, Copy, Check, Globe } from 'lucide-react';

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
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(0.85);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<'auto' | 'cantonese' | 'mandarin' | 'english'>('auto');
  
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // FORCE SHOW SPEAKER BUTTON FOR TESTING - set to true to always show
  const FORCE_SHOW_SPEAKER = true;
  
  const isChineseLanguage = () => {
    const chineseKeywords = [
      'Chinese', 'Cantonese', 'Taiwanese', 'zh', 
      '中文', '粵語', '台語', '国语', '普通话', 
      'Mandarin', 'mandarin', 'Traditional', 'Simplified'
    ];
    const lowerLang = langKey.toLowerCase();
    return chineseKeywords.some(keyword => lowerLang.includes(keyword.toLowerCase()));
  };

  const isCantonese = () => {
    const keywords = ['cantonese', '粵語', 'yue', 'zh-hk'];
    const lowerLang = langKey.toLowerCase();
    return keywords.some(keyword => lowerLang.includes(keyword.toLowerCase()));
  };

  const showSpeakerButton = FORCE_SHOW_SPEAKER || isChineseLanguage();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  // Get available voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        console.log('🔍 Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
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
        recognitionInstance.lang = isChineseLanguage() ? 'zh-TW' : 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          setTimeout(() => handleSend(transcript), 300);
        };
        
        recognitionInstance.onerror = () => setIsListening(false);
        recognitionInstance.onend = () => setIsListening(false);
        setRecognition(recognitionInstance);
      }
    }
  }, [langKey]);

  // Enhanced voice selection with language preference
  const findBestVoice = () => {
    console.log('🔍 Finding best voice for language:', voiceLanguage);
    
    let selectedVoice = null;

    // Check if we should use a specific language
    if (voiceLanguage === 'cantonese') {
      // PRIORITY 1: Exact Cantonese voices
      const cantoneseVoicePatterns = [
        'sin-ji', 'ting-ting', 'mui', 'yue', 'canton', 'hk', 
        'hong kong', 'cantonese', 'zh-hk', '粵語', '廣東話',
        'mei-jia', 'li-jing', 'hui'
      ];
      
      selectedVoice = availableVoices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return cantoneseVoicePatterns.some(pattern => 
          name.includes(pattern) || lang.includes(pattern) || lang.includes('zh-hk')
        );
      });

      if (selectedVoice) {
        console.log('✅ Found Cantonese voice:', selectedVoice.name, selectedVoice.lang);
        setSelectedVoiceName(`🎤 ${selectedVoice.name} (Cantonese)`);
        return selectedVoice;
      }
    }

    if (voiceLanguage === 'mandarin' || voiceLanguage === 'auto') {
      // PRIORITY 2: Mandarin/Chinese voices
      const mandarinPatterns = ['zh-cn', 'mandarin', 'chinese', 'putonghua', '普通话'];
      selectedVoice = availableVoices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return mandarinPatterns.some(pattern => 
          name.includes(pattern) || lang.includes(pattern) || lang.includes('zh-cn')
        );
      });

      if (selectedVoice) {
        console.log('✅ Found Mandarin voice:', selectedVoice.name, selectedVoice.lang);
        setSelectedVoiceName(`🎤 ${selectedVoice.name} (Mandarin)`);
        return selectedVoice;
      }
    }

    if (voiceLanguage === 'english' || voiceLanguage === 'auto') {
      // PRIORITY 3: English voices
      const englishPatterns = ['en-us', 'en-gb', 'english', 'zira', 'david'];
      selectedVoice = availableVoices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return englishPatterns.some(pattern => 
          name.includes(pattern) || lang.includes('en-')
        );
      });

      if (selectedVoice) {
        console.log('✅ Found English voice:', selectedVoice.name, selectedVoice.lang);
        setSelectedVoiceName(`🎤 ${selectedVoice.name} (English)`);
        return selectedVoice;
      }
    }

    // PRIORITY 4: Any Chinese voice (fallback)
    selectedVoice = availableVoices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return name.includes('chinese') || lang.includes('zh') || lang.includes('chi');
    });

    if (selectedVoice) {
      console.log('⚠️ Fallback to Chinese voice:', selectedVoice.name, selectedVoice.lang);
      setSelectedVoiceName(`🎤 ${selectedVoice.name} (Chinese - Fallback)`);
      return selectedVoice;
    }

    // PRIORITY 5: Any voice (last resort)
    if (availableVoices.length > 0) {
      console.log('⚠️ Using default voice');
      setSelectedVoiceName('🎤 Default Voice');
      return availableVoices[0];
    }

    console.log('❌ No voices available');
    setSelectedVoiceName('❌ No voice available');
    return null;
  };

  const speakText = (text: string, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking && speakingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const bestVoice = findBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Set language based on selection
    if (voiceLanguage === 'cantonese' || (voiceLanguage === 'auto' && isCantonese())) {
      utterance.lang = 'zh-HK';
    } else if (voiceLanguage === 'mandarin' || (voiceLanguage === 'auto' && isChineseLanguage())) {
      utterance.lang = 'zh-CN';
    } else if (voiceLanguage === 'english') {
      utterance.lang = 'en-US';
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageIndex(index);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

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

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        paddingBottom: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header - Sticky */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '12px',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Sparkles color="#10B981" size={18} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              🤖 AI Assistant
            </h3>
            
            {/* Language Selector */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '3px',
              background: '#F3F4F6',
              padding: '2px 6px',
              borderRadius: '6px'
            }}>
              <Globe size={12} color="#6B7280" />
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value as any)}
                style={{
                  fontSize: '9px',
                  padding: '1px 3px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#374151',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: '70px'
                }}
              >
                <option value="auto">🔄 Auto</option>
                <option value="cantonese">🇭🇰 Cantonese</option>
                <option value="mandarin">🇨🇳 Mandarin</option>
                <option value="english">🇬🇧 English</option>
              </select>
            </div>

            {showSpeakerButton && (
              <button
                onClick={() => {
                  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
                  if (lastAssistantMessage) {
                    const index = messages.findIndex(m => m === lastAssistantMessage);
                    speakText(lastAssistantMessage.content, index);
                  } else {
                    alert('No assistant message to read. Please ask a question first.');
                  }
                }}
                style={{
                  background: isSpeaking ? '#EF4444' : '#10B981',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                <span style={{ fontSize: '9px', fontWeight: '500' }}>
                  {isSpeaking ? 'Stop' : 'Listen'}
                </span>
              </button>
            )}
            
            {/* Voice info badge */}
            {selectedVoiceName && (
              <span style={{ 
                fontSize: '8px', 
                color: '#6B7280', 
                background: '#F3F4F6', 
                padding: '1px 4px', 
                borderRadius: '8px',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedVoiceName}
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#374151',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px',
              fontSize: '18px',
              fontWeight: 'bold',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Notice Banner - Compact */}
        <div style={{
          backgroundColor: '#ECFDF5', 
          border: '1px solid #A7F3D0', 
          borderRadius: '8px',
          padding: '8px 12px', 
          marginBottom: '10px', 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '8px',
          flexShrink: 0
        }}>
          <AlertCircle color="#059669" size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '11px', color: '#065F46', lineHeight: '1.3' }}>
            {getNoticeText()}
            {!canExecute && onUpgradePlan && (
              <button 
                onClick={onUpgradePlan}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  marginLeft: '6px', padding: '1px 6px', borderRadius: '4px',
                  backgroundColor: '#10B981', color: 'white', border: 'none',
                  fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                <Coffee size={10} /> Buy me a coffee ($5)
              </button>
            )}
          </div>
        </div>

        {/* Speed Control - Compact */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '8px',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '10px', color: '#6B7280' }}>🐢</span>
          <input 
            type="range" 
            min="0.5" 
            max="1.5" 
            step="0.05" 
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            style={{ 
              flex: 1, 
              height: '3px',
              borderRadius: '2px',
              background: '#D1D5DB',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
          />
          <span style={{ fontSize: '10px', color: '#6B7280' }}>🐇</span>
          <span style={{ fontSize: '9px', color: '#6B7280', minWidth: '25px' }}>
            {speechRate.toFixed(1)}x
          </span>
        </div>

        {/* Message Log - Scrollable */}
        <div 
          ref={messagesEndRef}
          style={{
            flex: 1,
            minHeight: '150px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px', 
            padding: '10px', 
            marginBottom: '10px', 
            border: '1px solid #E5E7EB',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '11px', paddingTop: '40px' }}>
              Ask any question or generate research analysis...
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', 
              marginBottom: '8px',
              width: '100%'
            }}>
              <div style={{
                maxWidth: '85%', 
                padding: '6px 10px', 
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#10B981' : 'white',
                color: msg.role === 'user' ? 'white' : '#1F2937',
                fontSize: '11px', 
                border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
              
              {/* Action buttons for assistant messages */}
              {msg.role === 'assistant' && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginTop: '3px',
                  marginLeft: '4px',
                  flexWrap: 'wrap'
                }}>
                  {showSpeakerButton && (
                    <button
                      onClick={() => speakText(msg.content, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: speakingMessageIndex === idx && isSpeaking ? '#EF4444' : '#6B7280',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '9px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {speakingMessageIndex === idx && isSpeaking ? (
                        <>
                          <VolumeX size={10} /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 size={10} /> 🔊 Listen
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => copyToClipboard(msg.content, idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedIndex === idx ? '#10B981' : '#6B7280',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '9px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={10} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
              <Loader2 size={12} className="animate-spin" /> Thinking...
            </div>
          )}
        </div>

        {/* Input Control - Fixed at bottom */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          flexShrink: 0,
          paddingTop: '4px',
          borderTop: '1px solid #F3F4F6'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "🎤 Listening..." : "Type your question..."}
            style={{
              flex: 1, 
              padding: '8px 10px', 
              borderRadius: '6px',
              border: '1px solid #D1D5DB', 
              fontSize: '11px', 
              outline: 'none',
              backgroundColor: isListening ? '#FEF3C7' : '#FFFFFF',
              WebkitAppearance: 'none',
              minHeight: '40px'
            }}
          />
          
          {/* MIC Button */}
          <button
            onClick={handleMicToggle}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: isListening ? '#EF4444' : '#3B82F6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
              transition: 'all 0.2s ease',
              boxShadow: isListening ? '0 0 0 3px rgba(239, 68, 68, 0.3)' : 'none',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            <Mic size={16} />
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '6px 14px', 
              borderRadius: '6px',
              backgroundColor: (isLoading || !input.trim()) ? '#9CA3AF' : '#10B981',
              color: 'white', 
              border: 'none', 
              cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: '600', 
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <Send size={14} />
          </button>
        </div>

        {/* Voice Input Status */}
        {isListening && (
          <div style={{
            marginTop: '6px',
            fontSize: '10px',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#EF4444', 
              animation: 'blink 1s infinite' 
            }} />
            Listening... Speak your question
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10B981;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10B981;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>
    </div>
  );
};