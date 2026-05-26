// Simple, reliable TTS that works across all browsers
// No complex initialization - works immediately

let currentUtterance: SpeechSynthesisUtterance | null = null;

const getLanguageCode = (langKey: string): string => {
  switch (langKey) {
    case 'Cantonese': return 'zh-HK';
    case '简体中文': return 'zh-CN';
    default: return 'en-US';
  }
};

// Try to find the best voice for the selected language
const findVoice = (langKey: string): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  
  const targetLang = getLanguageCode(langKey);
  
  // For Cantonese - look for specific voices
  if (langKey === 'Cantonese') {
    // Preferred order for Cantonese
    const patterns = [
      (v: SpeechSynthesisVoice) => v.name === 'Sin-ji',
      (v: SpeechSynthesisVoice) => v.name.includes('Sin-ji'),
      (v: SpeechSynthesisVoice) => v.lang === 'zh-HK',
      (v: SpeechSynthesisVoice) => v.lang === 'yue-HK',
      (v: SpeechSynthesisVoice) => v.lang.startsWith('zh'),
    ];
    
    for (const pattern of patterns) {
      const voice = voices.find(pattern);
      if (voice) return voice;
    }
  }
  
  // For Mandarin
  if (langKey === '简体中文') {
    const patterns = [
      (v: SpeechSynthesisVoice) => v.name === 'Ting-Ting',
      (v: SpeechSynthesisVoice) => v.name.includes('Ting-Ting'),
      (v: SpeechSynthesisVoice) => v.lang === 'zh-CN',
      (v: SpeechSynthesisVoice) => v.lang === 'cmn-CN',
      (v: SpeechSynthesisVoice) => v.lang.startsWith('zh'),
    ];
    
    for (const pattern of patterns) {
      const voice = voices.find(pattern);
      if (voice) return voice;
    }
  }
  
  // For English
  if (langKey === 'English') {
    const patterns = [
      (v: SpeechSynthesisVoice) => v.lang === 'en-US',
      (v: SpeechSynthesisVoice) => v.name === 'Samantha',
      (v: SpeechSynthesisVoice) => v.name === 'Alex',
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
    ];
    
    for (const pattern of patterns) {
      const voice = voices.find(pattern);
      if (voice) return voice;
    }
  }
  
  // Fallback: any voice with matching language prefix
  const prefix = targetLang.split('-')[0];
  return voices.find(v => v.lang.startsWith(prefix)) || null;
};

// Main speak function
export const speakText = (text: string, langKey: string, onEnd?: () => void): void => {
  if (!text || typeof window === 'undefined') return;
  
  // Stop current speech
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getLanguageCode(langKey);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  // Try to find a better voice
  const bestVoice = findVoice(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`[TTS] Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${langKey}`);
  } else {
    console.log(`[TTS] Using default voice for ${langKey}`);
  }
  
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (e) => {
    console.error('[TTS] Error:', e);
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const isSpeaking = (): boolean => {
  return currentUtterance !== null;
};
