'use client';
import { useEffect, useState } from 'react';
import { logAvailableVoices, getAvailableVoices } from '../utils/voiceUtils';

export const VoiceDebug = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
      setVoices(getAvailableVoices());
    };
    
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <details style={{ position: 'fixed', bottom: 0, right: 0, background: 'white', border: '1px solid #ccc', padding: 8, fontSize: 10, zIndex: 9999, maxWidth: 300 }}>
      <summary>Voice Debug (Dev only)</summary>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {voices.map(v => (
          <div key={v.name}>{v.name} - {v.lang}</div>
        ))}
      </div>
    </details>
  );
};
