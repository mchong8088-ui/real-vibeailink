"use client";
import React, { useState, useRef, useEffect } from 'react';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ currentVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getDisplayName = (voice: string) => {
    switch (voice) {
      case 'English': return '🔊 EN';
      case 'Cantonese': return '🔊 粵語';
      case 'Mandarin': return '🔊 普通話';
      case 'Taiwanese': return '🔊 國語';
      default: return '🔊 Voice';
    }
  };

  const getFullName = (voice: string) => {
    switch (voice) {
      case 'English': return 'English Voice';
      case 'Cantonese': return '粵語 (Cantonese)';
      case 'Mandarin': return '普通話 (Mainland Mandarin)';
      case 'Taiwanese': return '國語 (Taiwanese Mandarin)';
      default: return voice;
    }
  };

  const voiceOptions = ['English', 'Cantonese', 'Mandarin', 'Taiwanese'];

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
          minWidth: '220px',
          overflow: 'hidden'
        }}>
          {voiceOptions.map((voice) => (
            <button
              key={voice}
              onClick={() => {
                onVoiceChange(voice);
                localStorage.setItem('preferredVoice', voice);
                setIsOpen(false);
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