// Utility for cross-browser TTS with iOS Safari support

// Check if running on iOS Safari
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/(Windows Phone)/.test(ua);
};

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
};

export const getVoiceForLanguage = (langKey: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  
  const voices = window.speechSynthesis.getVoices();
  console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
  
  // For iOS, we need to use specific voice names
  if (isIOS()) {
    if (langKey === 'Cantonese') {
      // iOS uses "Sin-ji" for Cantonese
      const iosCantonese = voices.find(v => 
        v.name === 'Sin-ji' || 
        v.name.includes('Sin-ji') ||
        v.lang === 'zh-HK' ||
        v.lang === 'yue-HK'
      );
      if (iosCantonese) return iosCantonese;
    } else if (langKey === '简体中文') {
      // iOS uses "Ting-Ting" for Mandarin
      const iosMandarin = voices.find(v => 
        v.name === 'Ting-Ting' || 
        v.name.includes('Ting-Ting') ||
        v.lang === 'zh-CN' ||
        v.lang === 'zh-TW'
      );
      if (iosMandarin) return iosMandarin;
    }
  }
  
  // For Chrome/Android and fallback
  const preferences = {
    Cantonese: {
      langs: ['zh-HK', 'zh-Hant-HK', 'yue-HK', 'zh-TW', 'zh-Hant'],
      names: ['Google Cantonese', 'Cantonese', 'Sin-ji', 'HK']
    },
    '简体中文': {
      langs: ['zh-CN', 'zh-Hans-CN', 'cmn-CN', 'zh'],
      names: ['Google Mandarin', 'Ting-Ting', 'Chinese', 'Mandarin']
    },
    English: {
      langs: ['en-US', 'en-GB', 'en-AU'],
      names: ['Google US English', 'Samantha', 'Alex', 'English']
    }
  };
  
  const prefs = preferences[langKey as keyof typeof preferences];
  if (!prefs) return null;
  
  // Try exact language match
  let voice = voices.find(v => prefs.langs.includes(v.lang));
  if (voice) return voice;
  
  // Try name match
  voice = voices.find(v => 
    prefs.names.some(name => v.name.toLowerCase().includes(name.toLowerCase()))
  );
  if (voice) return voice;
  
  // Try language prefix
  const prefix = prefs.langs[0].split('-')[0];
  voice = voices.find(v => v.lang.startsWith(prefix));
  if (voice) return voice;
  
  return null;
};

export const speakWithBrowserSupport = (
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
  
  // Set language tag
  let langTag = 'en-US';
  if (langKey === 'Cantonese') {
    langTag = 'zh-HK';
    // iOS needs this specific formatting
    if (isIOS()) {
      // Split text into smaller chunks for iOS
      utterance.text = text;
    }
  } else if (langKey === '简体中文') {
    langTag = 'zh-CN';
  }
  utterance.lang = langTag;
  
  // Try to get the best voice
  const bestVoice = getVoiceForLanguage(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`✓ Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${langKey}`);
  } else {
    console.log(`⚠ No specific voice found for ${langKey}, using default with lang=${langTag}`);
    // For iOS, if no voice found, try to trigger voice download
    if (isIOS() && langKey !== 'English') {
      console.log('📱 iOS: User may need to download voice in Settings > Accessibility > Spoken Content > Voices');
    }
  }
  
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;
  
  // For Safari/iOS, we need to ensure voices are loaded
  const speak = () => {
    window.speechSynthesis.speak(utterance);
  };
  
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Re-get the voice after voices are loaded
      const newVoice = getVoiceForLanguage(langKey);
      if (newVoice) utterance.voice = newVoice;
      speak();
    };
  } else {
    speak();
  }
  
  return utterance;
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};

// Helper to check what voices are available (for debugging)
export const logAvailableVoices = () => {
  if (typeof window === 'undefined') return;
  const voices = window.speechSynthesis.getVoices();
  console.log('=== Available Voices ===');
  voices.forEach(v => console.log(`- ${v.name} (${v.lang})`));
  console.log('=======================');
};
