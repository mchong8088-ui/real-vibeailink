"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Volume2, VolumeX, Download, Mic } from 'lucide-react';

interface AIResearchAssistantProps {
  langKey: string;
  user: any;
  profile: any;
  onUpgradePlan?: () => void;
  onOpenVoiceModalWithScript?: (scriptText: string) => void;
}

export const AIResearchAssistant: React.FC<AIResearchAssistantProps> = ({
  langKey,
  user,
  profile,
  onUpgradePlan,
  onOpenVoiceModalWithScript,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isExportingMP3, setIsExportingMP3] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser TTS voices
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

  // Access rights calculation
  const isSubscriber = Boolean(profile?.subscription_plan && profile.subscription_plan !== 'Free Explorer');
  const hasEnoughCredits = (profile?.credits || 0) >= 300;
  const canUseFeature = isSubscriber || hasEnoughCredits;
  const isLoggedIn = !!user;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!isEnabled) {
      alert(
        langKey === 'Cantonese' ? '請先啟用 AI 增強功能' : 
        langKey === 'Simplified Chinese' ? '请先启用 AI 增强功能' : 
        'Please enable AI Enhancement first'
      );
      return;
    }
    
    if (!isLoggedIn) {
      alert(
        langKey === 'Cantonese' ? '請先登入使用 AI 研究助理' : 
        langKey === 'Simplified Chinese' ? '请先登录使用 AI 研究助理' : 
        'Please login to use AI Research Assistant'
      );
      return;
    }

    if (!canUseFeature) {
      const confirm = window.confirm(
        langKey === 'Cantonese' ? '此功能需要訂閱或至少 300 積分。是否升級計劃？' :
        langKey === 'Simplified Chinese' ? '此功能需要订阅或至少 300 积分。是否升级计划？' :
        'This feature requires a subscription or at least 300 credits. Would you like to upgrade?'
      );
      if (confirm && onUpgradePlan) {
        onUpgradePlan();
      }
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          language: langKey,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        speakText(data.response);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchedVoice = (voices: SpeechSynthesisVoice[]) => {
    let targetVoice: SpeechSynthesisVoice | undefined;

    if (langKey === 'Cantonese' || langKey === 'Traditional Chinese') {
      // Prioritize Danny / Male voices for Cantonese over Sin-Ji
      targetVoice = voices.find(v => v.lang === 'zh-HK' && (v.name.includes('Danny') || v.name.includes('Male')));
      if (!targetVoice) targetVoice = voices.find(v => v.lang === 'zh-HK' && !v.name.includes('Sin-Ji'));
      if (!targetVoice) targetVoice = voices.find(v => v.lang === 'zh-HK');
    } else if (langKey === 'Taiwanese' || langKey === 'Traditional Chinese (Taiwan)') {
      targetVoice = voices.find(v => v.lang === 'zh-TW' && (v.name.includes('Yun-Jhe') || v.name.includes('Male')));
      if (!targetVoice) targetVoice = voices.find(v => v.lang === 'zh-TW');
    } else if (langKey === 'Simplified Chinese' || langKey === 'Mandarin') {
      targetVoice = voices.find(v => v.lang === 'zh-CN' && (v.name.includes('Yunxi') || v.name.includes('Male') || v.name.includes('Kangkang')));
      if (!targetVoice) targetVoice = voices.find(v => v.lang === 'zh-CN');
    } else {
      targetVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Alex') || v.name.includes('Male') || v.name.includes('David')));
      if (!targetVoice) targetVoice = voices.find(v => v.lang.startsWith('en'));
    }

    return targetVoice;
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const targetVoice = getMatchedVoice(voices);

    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    }

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Export audio/text response as an MP3 file
  const handleExportMP3 = async () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return;

    setIsExportingMP3(true);

    try {
      const response = await fetch('/api/youtube/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          script: lastAssistantMsg.content,
          language: langKey,
          useGateway: false,
        }),
      });

      const data = await response.json();

      if (data.success && data.audio) {
        const a = document.createElement('a');
        a.href = `data:audio/mp3;base64,${data.audio}`;
        a.download = `voice_report_${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || 'Failed to export MP3 audio.');
      }
    } catch (err) {
      console.error('Failed to export MP3:', err);
    } finally {
      setIsExportingMP3(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    stopSpeaking();
  };

  const toggleEnable = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    
    if (checked && !isLoggedIn) {
      alert(
        langKey === 'Cantonese' ? '請先登入使用此功能' : 
        langKey === 'Simplified Chinese' ? '请先登录使用此功能' : 
        'Please login first'
      );
      setIsEnabled(false);
      return;
    }
    
    if (checked && !canUseFeature) {
      const confirm = window.confirm(
        langKey === 'Cantonese' ? '此功能需要訂閱或至少 300 積分。是否升級計劃？' :
        langKey === 'Simplified Chinese' ? '此功能需要订阅或至少 300 积分。是否升级计划？' :
        'This feature requires a subscription or at least 300 credits. Would you like to upgrade?'
      );
      if (confirm && onUpgradePlan) {
        onUpgradePlan();
      }
      setIsEnabled(false);
      return;
    }
    
    setIsEnabled(checked);
    if (!checked) {
      setMessages([]);
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      marginTop: '16px',
      width: '100%',
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '8px 14px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
          <Sparkles size={16} color={isEnabled ? '#8B5CF6' : '#9CA3AF'} />
          <span style={{ fontWeight: '600', fontSize: '13px', color: '#1F2937' }}>
            AI Assistant
            {!isSubscriber && <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '400', marginLeft: '6px' }}>(Subscriber only)</span>}
          </span>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isLoggedIn ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            color: isEnabled ? '#8B5CF6' : '#6B7280',
            fontWeight: '500',
            marginLeft: '4px',
            opacity: isLoggedIn ? 1 : 0.5,
          }}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleEnable}
              disabled={!isLoggedIn}
              style={{
                width: '16px',
                height: '16px',
                cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                accentColor: '#8B5CF6',
              }}
            />
            Enable AI Enhancement
          </label>
          
          {isEnabled && (
            <span style={{ fontSize: '9px', backgroundColor: '#D1FAE5', color: '#065F46', padding: '1px 8px', borderRadius: '10px' }}>
              ● Active
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: isEnabled ? '#8B5CF6' : '#9CA3AF' }}>
            {isEnabled ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg style={{ width: '14px', height: '14px', color: '#6B7280', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '10px 14px' }}>
          {/* Messages display */}
          <div style={{
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: isEnabled ? '#F9FAFB' : '#F3F4F6',
            borderRadius: '10px',
            padding: '8px 10px',
            marginBottom: '8px',
            minHeight: '50px',
            opacity: isEnabled ? 1 : 0.6,
          }}>
            {!isEnabled && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '12px 0' }}>
                <p style={{ margin: 0 }}>☑️ Check "Enable AI Enhancement" above to start</p>
              </div>
            )}
            {isEnabled && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '8px 0' }}>
                <p style={{ margin: 0 }}>Ask me anything! (Stocks, travel, YouTube scripts, general knowledge)</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px',
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: msg.role === 'user' ? '#3B82F6' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1F2937',
                  fontSize: '12px',
                  border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>
                  {msg.content}
                </div>

                {/* Send to Voice Provider Action Connector */}
                {msg.role === 'assistant' && onOpenVoiceModalWithScript && (
                  <button
                    onClick={() => onOpenVoiceModalWithScript(msg.content)}
                    style={{
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #8B5CF6',
                      backgroundColor: '#F3E8FF',
                      color: '#6B21A8',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Mic size={11} /> Send Script to Voice Provider (MP3 / SRT)
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '4px' }}>
                <div style={{ backgroundColor: 'white', padding: '5px 10px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input control strip */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isEnabled && input.trim()) {
                  handleSend();
                }
              }}
              placeholder={isEnabled ? "Ask any question or request a script..." : "Enable AI Enhancement to ask questions"}
              disabled={!isEnabled || !isLoggedIn}
              style={{
                flex: 1,
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                backgroundColor: (isEnabled && isLoggedIn) ? '#FFFFFF' : '#F3F4F6',
                fontSize: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
                height: '30px',
                color: (isEnabled && isLoggedIn) ? '#1F2937' : '#9CA3AF',
              }}
              onFocus={(e) => { 
                if (isEnabled && isLoggedIn) {
                  e.currentTarget.style.borderColor = '#8B5CF6';
                }
              }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !isEnabled || !isLoggedIn || isLoading}
              style={{
                padding: '3px 12px',
                borderRadius: '20px',
                backgroundColor: (input.trim() && isEnabled && isLoggedIn && !isLoading) ? '#8B5CF6' : '#E5E7EB',
                color: 'white',
                border: 'none',
                cursor: (input.trim() && isEnabled && isLoggedIn && !isLoading) ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                fontWeight: '500',
                height: '30px',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
                  if (lastAssistantMsg) {
                    isSpeaking ? stopSpeaking() : speakText(lastAssistantMsg.content);
                  }
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '50%',
                  backgroundColor: isSpeaking ? '#EF4444' : '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer',
                  color: isSpeaking ? 'white' : '#4B5563',
                  transition: 'all 0.2s',
                  height: '30px',
                  width: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleExportMP3}
                disabled={isExportingMP3}
                style={{
                  padding: '4px 10px',
                  borderRadius: '15px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                title="Export voice response to MP3"
              >
                {isExportingMP3 ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Export MP3
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                style={{
                  padding: '4px 8px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  height: '30px',
                  width: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Clear chat"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};