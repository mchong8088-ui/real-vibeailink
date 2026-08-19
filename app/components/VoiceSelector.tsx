"use client";
import React, { useState, useRef, useEffect } from 'react';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ currentVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Define all available voices with their categories based on your system
  const voiceOptions = [
    // Cantonese Voices (zh_HK)
    { id: 'Aasing (Enhanced)', label: 'Aasing (Enhanced)', category: 'Cantonese', emoji: '🇭🇰' },
    { id: 'Sinji', label: 'Sinji', category: 'Cantonese', emoji: '🇭🇰' },
    
    // Mandarin Voices (zh_CN)
    { id: 'Tingting', label: 'Tingting', category: 'Mandarin', emoji: '🇨🇳' },
    { id: 'Han (Enhanced)', label: 'Han (Enhanced)', category: 'Mandarin', emoji: '🇨🇳' },
    { id: 'Lili (Enhanced)', label: 'Lili (Enhanced)', category: 'Mandarin', emoji: '🇨🇳' },
    { id: 'Tiantian (Enhanced)', label: 'Tiantian (Enhanced)', category: 'Mandarin', emoji: '🇨🇳' },
    
    // Taiwanese Mandarin (zh_TW)
    { id: 'Meijia', label: 'Meijia', category: 'Taiwanese', emoji: '🇹🇼' },
    { id: 'Meijia (Premium)', label: 'Meijia (Premium)', category: 'Taiwanese', emoji: '🇹🇼' },
    
    // English Voices
    { id: 'Samantha', label: 'Samantha', category: 'English', emoji: '🇺🇸' },
    { id: 'Ava (Enhanced)', label: 'Ava (Enhanced)', category: 'English', emoji: '🇺🇸' },
    { id: 'Evan (Enhanced)', label: 'Evan (Enhanced)', category: 'English', emoji: '🇺🇸' },
    { id: 'Daniel', label: 'Daniel', category: 'English', emoji: '🇬🇧' },
    { id: 'Karen', label: 'Karen', category: 'English', emoji: '🇦🇺' },
    { id: 'Moira', label: 'Moira', category: 'English', emoji: '🇮🇪' },
  ];

  // Get the selected voice object
  const selectedVoiceObj = voiceOptions.find(v => v.id === currentVoice) || voiceOptions[0];

  const getDisplayName = (voiceId: string) => {
    const voice = voiceOptions.find(v => v.id === voiceId);
    if (!voice) return '🔊 Select Voice';
    return `${voice.emoji} ${voice.label}`;
  };

  const handleVoiceChange = (voiceId: string) => {
    onVoiceChange(voiceId);
    localStorage.setItem('preferredVoice', voiceId);
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

  // Group voices by category
  const groupedVoices = voiceOptions.reduce((acc, voice) => {
    if (!acc[voice.category]) {
      acc[voice.category] = [];
    }
    acc[voice.category].push(voice);
    return acc;
  }, {} as Record<string, typeof voiceOptions>);

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D5DB',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getDisplayName(currentVoice)}
        </span>
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
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '4px 0'
        }}>
          {Object.entries(groupedVoices).map(([category, voices]) => (
            <div key={category}>
              <div style={{
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {category}
              </div>
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => {
                    handleVoiceChange(voice.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    backgroundColor: currentVoice === voice.id ? '#EFF6FF' : 'white',
                    color: currentVoice === voice.id ? '#2563EB' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: currentVoice === voice.id ? '600' : '400',
                    borderBottom: '1px solid #F3F4F6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentVoice !== voice.id) {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentVoice !== voice.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{voice.emoji}</span>
                  <span style={{ flex: 1 }}>{voice.label}</span>
                  {currentVoice === voice.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};