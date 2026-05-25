// utils/tts.ts
export const speakWithLanguage = (
  text: string, 
  langKey: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null => {
  if (!text || typeof window === 'undefined') return null;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language based on user selection
  switch (langKey) {
    case 'Cantonese':
      utterance.lang = 'zh-HK';
      break;
    case '简体中文':
      utterance.lang = 'zh-CN';
      break;
    default:
      utterance.lang = 'en-US';
  }
  
  // Try to get the best matching voice
  const setBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = null;
    
    if (langKey === 'Cantonese') {
      bestVoice = voices.find(v => v.lang === 'zh-HK' || v.lang === 'zh-Hant-HK');
    } else if (langKey === '简体中文') {
      bestVoice = voices.find(v => v.lang === 'zh-CN');
    } else {
      bestVoice = voices.find(v => v.lang === 'en-US');
    }
    
    if (bestVoice) utterance.voice = bestVoice;
  };
  
  // Voices might not be loaded yet
  if (window.speechSynthesis.getVoices().length > 0) {
    setBestVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = setBestVoice;
  }
  
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;
  
  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};
