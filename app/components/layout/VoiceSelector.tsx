"use client";
import React, { useState, useRef, useEffect } from 'react';
import { speak, stopSpeech } from '../../utils/ttsMaster';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ currentVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect mobile device
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  const getDisplayName = (voice: string) => {
    if (isMobile) {
      switch (voice) {
        case 'English': return '🔊 EN';
        case 'Cantonese': return '🔊 粵語';
        case 'Mandarin': return '🔊 普通話';
        case 'Taiwanese': return '🔊 國語';
        default: return '🔊 Voice';
      }
    }
    switch (voice) {
      case 'English': return '🔊 EN';
      case 'Cantonese': return '🔊 粵語';
      case 'Mandarin': return '🔊 普通話';
      case 'Taiwanese': return '🔊 國語';
      default: return '🔊 Voice';
    }
  };

  const getFullName = (voice: string) => {
    if (isMobile) {
      switch (voice) {
        case 'English': return 'English Voice';
        case 'Cantonese': return '粵語 (Cantonese)';
        case 'Mandarin': return '普通話 (Mandarin)';
        case 'Taiwanese': return '國語 (Taiwanese) - 與普通話共用同一語音';
        default: return voice;
      }
    }
    switch (voice) {
      case 'English': return 'English Voice (Samantha/Alex)';
      case 'Cantonese': return '粵語 (Cantonese) - Sin-ji';
      case 'Mandarin': return '普通話 (Mandarin) - Ting-Ting';
      case 'Taiwanese': return '國語 (Taiwanese) - Mei-Jia';
      default: return voice;
    }
  };

  const voiceOptions = ['English', 'Cantonese', 'Mandarin', 'Taiwanese'];

  // Get the Michael & Teresa greeting for each voice
  const getMichaelTeresaGreeting = (voice: string): string => {
    switch (voice) {
      case 'Cantonese':
        return '你好，我哋係米高和杜麗莎，你嘅財務和市場分析員，好高興為你服務。';
      case 'Mandarin':
        return '你好，我们是米高和杜丽莎，你的财务和市场分析师，很高兴为你服务。';
      case 'Taiwanese':
        return '你好，我們是米高和杜麗莎，你的財務和市場分析員，很高興為你服務。';
      default:
        return 'Hello, this is Michael and Teresa, your Finance and Market Analysts, here to serve you.';
    }
  };

  // Test the voice with proper greeting when selected
  const testVoice = async (voice: string) => {
    // Stop any ongoing speech
    stopSpeech();
    
    // Wait a moment for the speech to cancel
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the appropriate greeting
    const greeting = getMichaelTeresaGreeting(voice);
    
    // Use the unified TTS system
    // The textLanguage parameter determines number formatting
    let textLanguage = 'English';
    if (voice === 'Cantonese') textLanguage = 'Traditional Chinese';
    else if (voice === 'Mandarin' || voice === 'Taiwanese') textLanguage = 'Simplified Chinese';
    
    // Speak the greeting using the unified system
    await speak(greeting, textLanguage, voice);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {getDisplayName(currentVoice)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: isMobile ? '220px' : '260px',
          overflow: 'hidden'
        }}>
          {voiceOptions.map((voice) => (
            <button
              key={voice}
              onClick={() => {
                onVoiceChange(voice);
                localStorage.setItem('preferredVoice', voice);
                setIsOpen(false);
                // Test the voice with Michael & Teresa greeting after selection
                setTimeout(() => testVoice(voice), 100);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: currentVoice === voice ? '#EFF6FF' : 'white',
                color: currentVoice === voice ? '#2563EB' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: currentVoice === voice ? '600' : '400',
                borderBottom: '1px solid #E5E7EB',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentVoice !== voice) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (currentVoice !== voice) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {getFullName(voice)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};