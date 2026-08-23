"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voice: string) => void;
  mode?: 'voice' | 'preview';
}

// ============================================================
// ORIGINAL MACOS SYSTEM VOICES + AUTO VOICES
// ============================================================
const MACOS_VOICES = [
  // Cantonese Voices
  { name: 'Aasing (Enhanced)', language: 'Cantonese', gender: 'Male', quality: 'Enhanced' },
  { name: 'Aasing', language: 'Cantonese', gender: 'Male', quality: 'Standard' },
  { name: 'Sinji', language: 'Cantonese', gender: 'Female', quality: 'Standard' },
  
  // Mandarin Voices
  { name: 'Tingting', language: 'Mandarin', gender: 'Female', quality: 'Standard' },
  { name: 'Han (Enhanced)', language: 'Mandarin', gender: 'Male', quality: 'Enhanced' },
  
  // English Voices
  { name: 'Samantha', language: 'English', gender: 'Female', quality: 'Standard' },
  { name: 'Victoria', language: 'English', gender: 'Female', quality: 'Standard' },
  { name: 'Alex', language: 'English', gender: 'Male', quality: 'Standard' },
  { name: 'Fred', language: 'English', gender: 'Male', quality: 'Standard' },
  { name: 'Nick', language: 'English', gender: 'Male', quality: 'Standard' },
  
  // Auto Voices (Fallback to Cloud)
  { name: 'Auto-Male', language: 'Auto (Cloud)', gender: 'Male', quality: 'Cloud' },
  { name: 'Auto-Female', language: 'Auto (Cloud)', gender: 'Female', quality: 'Cloud' },
];

// Group voices by language for better UX
const VOICE_GROUPS = {
  'Cantonese (粤語)': ['Aasing (Enhanced)', 'Aasing', 'Sinji'],
  'Mandarin (國語)': ['Tingting', 'Han (Enhanced)'],
  'English': ['Samantha', 'Victoria', 'Alex', 'Fred', 'Nick'],
  'Auto (Cloud Fallback)': ['Auto-Male', 'Auto-Female'],
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  onVoiceChange,
  mode = 'voice',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set default voice if none selected
  useEffect(() => {
    if (!currentVoice || currentVoice === '') {
      // Default to Auto-Female for web, Aasing for desktop
      const isWeb = typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('localhost'));
      
      const defaultVoice = isWeb ? 'Auto-Female' : 'Aasing (Enhanced)';
      onVoiceChange(defaultVoice);
    }
  }, []);

  // Get voice label
  const getVoiceLabel = (voiceName: string): string => {
    const voice = MACOS_VOICES.find(v => v.name === voiceName);
    if (voice) {
      return `${voice.name} (${voice.language}${voice.quality !== 'Standard' ? ` • ${voice.quality}` : ''})`;
    }
    return voiceName;
  };

  // Get current voice display name
  const getCurrentDisplayName = (): string => {
    if (!currentVoice) return 'Select Voice...';
    const voice = MACOS_VOICES.find(v => v.name === currentVoice);
    if (voice) {
      return `${voice.name} (${voice.gender})`;
    }
    return currentVoice;
  };

  // Handle voice selection
  const handleSelect = (voiceName: string) => {
    onVoiceChange(voiceName);
    setIsOpen(false);
  };

  // Render voice group
  const renderVoiceGroup = (groupName: string, voices: string[]) => {
    const isCloudGroup = groupName.includes('Cloud');
    
    return (
      <div key={groupName} style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: isCloudGroup ? '#7C3AED' : '#6B7280',
          padding: '4px 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {isCloudGroup && '☁️ '}
          {groupName}
          {isCloudGroup && (
            <span style={{
              fontSize: '8px',
              backgroundColor: '#7C3AED',
              color: 'white',
              padding: '1px 8px',
              borderRadius: '10px',
              fontWeight: '400',
            }}>
              FALLBACK
            </span>
          )}
        </div>
        {voices.map((voiceName) => {
          const voice = MACOS_VOICES.find(v => v.name === voiceName);
          const isSelected = currentVoice === voiceName;
          const isCloud = voice?.quality === 'Cloud';
          
          return (
            <button
              key={voiceName}
              onClick={() => handleSelect(voiceName)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: isSelected ? '#EFF6FF' : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: isSelected ? '#1E40AF' : '#374151',
                transition: 'all 0.15s ease',
                opacity: isCloud ? 0.85 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isCloud ? '#F5F3FF' : '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSelected && <Check size={12} color="#3B82F6" />}
                {isCloud ? '☁️' : (voice?.gender === 'Male' ? '👨' : voice?.gender === 'Female' ? '👩' : '🎤')}
                <span>{voiceName}</span>
                {voice?.quality === 'Enhanced' && (
                  <span style={{
                    fontSize: '8px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    Enhanced
                  </span>
                )}
                {isCloud && (
                  <span style={{
                    fontSize: '8px',
                    backgroundColor: '#7C3AED',
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    Cloud
                  </span>
                )}
              </span>
              <span style={{
                fontSize: '9px',
                color: isCloud ? '#7C3AED' : '#9CA3AF',
              }}>
                {voice?.language || ''}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 10px',
          borderRadius: '6px',
          border: currentVoice?.includes('Auto') ? '2px solid #7C3AED' : '1px solid #D1D5DB',
          background: currentVoice?.includes('Auto') ? '#F5F3FF' : '#FFFFFF',
          fontSize: '12px',
          color: '#111827',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = currentVoice?.includes('Auto') ? '#6D28D9' : '#9CA3AF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = currentVoice?.includes('Auto') ? '#7C3AED' : '#D1D5DB';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <span style={{ fontSize: '14px' }}>
              {currentVoice === 'Auto-Male' ? '☁️👨' : 
               currentVoice === 'Auto-Female' ? '☁️👩' : 
               currentVoice?.includes('Aasing') ? '👨' : 
               currentVoice?.includes('Sinji') ? '👩' : '🎤'}
            </span>
          )}
          <span>{getCurrentDisplayName()}</span>
          {currentVoice?.includes('Auto') && (
            <span style={{
              fontSize: '8px',
              backgroundColor: '#7C3AED',
              color: 'white',
              padding: '1px 8px',
              borderRadius: '10px',
              fontWeight: '400',
            }}>
              CLOUD
            </span>
          )}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#6B7280'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay to close dropdown */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '8px 0',
          }}>
            {Object.entries(VOICE_GROUPS).map(([groupName, voices]) => 
              renderVoiceGroup(groupName, voices)
            )}
            
            {/* Help text */}
            <div style={{
              padding: '8px 12px',
              borderTop: '1px solid #F3F4F6',
              fontSize: '9px',
              color: '#9CA3AF',
              textAlign: 'center',
            }}>
              💡 {mode === 'preview' ? 'Preview voice' : 'Select a voice for generation'}
              {' • '}
              ☁️ Cloud voices work on all devices (fallback to OpenAI)
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceSelector;