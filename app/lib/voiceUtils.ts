// voiceUtils.ts - Complete replacement

// Check if running on iOS Safari
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/(Windows Phone)/.test(ua);
};

// Cache voices to avoid repeated lookups
let cachedVoices: SpeechSynthesisVoice[] | null = null;

export const getAvailableVoices = (refresh = false): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined') return [];
  if (refresh || !cachedVoices) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
};

// Refresh voice list (useful after voiceschanged event)
export const refreshVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined') return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
};

// Detect what voices are actually available on the current device
export const detectAvailableChineseVoices = () => {
  const voices = getAvailableVoices();
  
  const result = {
    hasMandarin: false,
    hasTaiwanese: false,
    hasCantonese: false,
    mandarinVoices: [] as SpeechSynthesisVoice[],
    taiwaneseVoices: [] as SpeechSynthesisVoice[],
    cantoneseVoices: [] as SpeechSynthesisVoice[],
    defaultChineseVoice: null as SpeechSynthesisVoice | null,
  };
  
  voices.forEach(voice => {
    // Mandarin (China) - zh-CN
    if (voice.lang === 'zh-CN' || voice.lang.startsWith('zh-CN')) {
      result.hasMandarin = true;
      result.mandarinVoices.push(voice);
    }
    // Taiwanese Mandarin (Taiwan) - zh-TW
    else if (voice.lang === 'zh-TW' || voice.lang.startsWith('zh-TW')) {
      result.hasTaiwanese = true;
      result.taiwaneseVoices.push(voice);
    }
    // Cantonese (Hong Kong) - zh-HK, yue
    else if (voice.lang === 'zh-HK' || voice.lang.startsWith('zh-HK') || voice.lang === 'yue-HK') {
      result.hasCantonese = true;
      result.cantoneseVoices.push(voice);
    }
    // iOS specific names
    else if (voice.name === 'Ting-Ting' || voice.name.includes('Ting')) {
      result.hasMandarin = true;
      result.mandarinVoices.push(voice);
    }
    else if (voice.name === 'Sin-ji' || voice.name.includes('Sin-ji')) {
      result.hasCantonese = true;
      result.cantoneseVoices.push(voice);
    }
  });
  
  // Determine best default Chinese voice (prefer Mandarin, then Taiwanese, then Cantonese)
  if (result.hasMandarin) {
    result.defaultChineseVoice = result.mandarinVoices[0];
  } else if (result.hasTaiwanese) {
    result.defaultChineseVoice = result.taiwaneseVoices[0];
  } else if (result.hasCantonese) {
    result.defaultChineseVoice = result.cantoneseVoices[0];
  }
  
  return result;
};

// Get the best voice with intelligent fallback chain
export const getBestVoiceWithFallback = (
  targetLanguage: string, // 'Cantonese', 'Mandarin', 'Taiwanese', 'English'
  availableVoices?: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null => {
  const voices = availableVoices || getAvailableVoices();
  if (voices.length === 0) return null;
  
  // Define voice preferences with fallback chain
  const voicePreferences: Record<string, {
    primary: Array<{ lang?: string; name?: string; }>;
    fallback: string[]; // fallback language codes in order
    iosNames: string[];
  }> = {
    'Mandarin': {
      primary: [
        { lang: 'zh-CN' },
        { name: 'Ting-Ting' },
        { name: 'Mei-Jia' },
        { name: 'Google 普通话' },
      ],
      fallback: ['zh-TW', 'zh-HK'], // Fallback to Taiwanese, then Cantonese
      iosNames: ['Ting-Ting', 'Mei-Jia', 'Li-Li'],
    },
    'Taiwanese': {
      primary: [
        { lang: 'zh-TW' },
        { name: 'Mei-Jia' },
      ],
      fallback: ['zh-CN', 'zh-HK'], // Fallback to Mandarin, then Cantonese
      iosNames: ['Mei-Jia', 'Ting-Ting'],
    },
    'Cantonese': {
      primary: [
        { lang: 'zh-HK' },
        { lang: 'yue-HK' },
        { name: 'Sin-ji' },
      ],
      fallback: ['zh-CN', 'zh-TW'], // Fallback to Mandarin, then Taiwanese
      iosNames: ['Sin-ji'],
    },
    'English': {
      primary: [
        { lang: 'en-US' },
        { name: 'Samantha' },
        { name: 'Alex' },
        { name: 'Google US English' },
      ],
      fallback: ['en-GB', 'en-AU'],
      iosNames: ['Samantha', 'Alex'],
    },
  };
  
  const prefs = voicePreferences[targetLanguage];
  if (!prefs) return null;
  
  // 1. Try primary matches
  for (const primary of prefs.primary) {
    let voice: SpeechSynthesisVoice | undefined;
    
    if (primary.lang) {
      voice = voices.find(v => v.lang === primary.lang || v.lang.startsWith(primary.lang));
    } else if (primary.name) {
      voice = voices.find(v => v.name === primary.name || v.name.includes(primary.name!));
    }
    
    if (voice) {
      console.log(`✓ Found ${targetLanguage} voice: ${voice.name} (${voice.lang})`);
      return voice;
    }
  }
  
  // 2. Try iOS specific names if on iOS
  if (isIOS()) {
    for (const iosName of prefs.iosNames) {
      const voice = voices.find(v => v.name === iosName || v.name.includes(iosName));
      if (voice) {
        console.log(`✓ Found iOS ${targetLanguage} voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }
  }
  
  // 3. Try fallback languages
  for (const fallbackLang of prefs.fallback) {
    const voice = voices.find(v => v.lang === fallbackLang || v.lang.startsWith(fallbackLang));
    if (voice) {
      console.log(`⚠ Using fallback voice for ${targetLanguage}: ${voice.name} (${voice.lang})`);
      return voice;
    }
  }
  
  // 4. Ultimate fallback: any Chinese voice for Chinese languages, any English for English
  if (targetLanguage !== 'English') {
    const anyChinese = voices.find(v => 
      v.lang.startsWith('zh-') || 
      v.lang.startsWith('yue-') ||
      v.name === 'Ting-Ting' ||
      v.name === 'Sin-ji'
    );
    if (anyChinese) {
      console.log(`⚠ Ultimate fallback for ${targetLanguage}: ${anyChinese.name} (${anyChinese.lang})`);
      return anyChinese;
    }
  } else {
    const anyEnglish = voices.find(v => v.lang.startsWith('en-'));
    if (anyEnglish) return anyEnglish;
  }
  
  console.log(`❌ No voice found for ${targetLanguage}`);
  return null;
};

// Main function to get voice for language (with auto-detection and fallback)
export const getVoiceForLanguage = (langKey: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  
  // Refresh voices to ensure we have latest (especially important on iOS)
  const voices = refreshVoices();
  
  if (voices.length === 0) {
    // Wait for voices to load
    console.log('⏳ Waiting for voices to load...');
    return null;
  }
  
  console.log(`🔍 Looking for voice for: ${langKey}`);
  console.log(`📱 Available voices (${voices.length}):`, voices.map(v => `${v.name} (${v.lang})`));
  
  // Map langKey to target language
  let targetLanguage = '';
  if (langKey === 'Cantonese' || langKey === '繁体中文' || langKey === 'Traditional Chinese') {
    targetLanguage = 'Cantonese';
  } else if (langKey === 'Mandarin' || langKey === '简体中文' || langKey === 'Simplified Chinese') {
    targetLanguage = 'Mandarin';
  } else if (langKey === 'Taiwanese' || langKey === '繁體中文' || langKey === 'zh-TW') {
    targetLanguage = 'Taiwanese';
  } else {
    targetLanguage = 'English';
  }
  
  return getBestVoiceWithFallback(targetLanguage, voices);
};

// Diagnostic function to log voice capabilities (useful for debugging)
export const logVoiceCapabilities = () => {
  if (typeof window === 'undefined') return;
  
  const voices = getAvailableVoices(true);
  const detection = detectAvailableChineseVoices();
  
  console.log('=== VOICE CAPABILITIES ===');
  console.log('Device:', isIOS() ? 'iOS' : 'Other');
  console.log('Total voices:', voices.length);
  console.log('Has Mandarin (zh-CN):', detection.hasMandarin);
  console.log('Has Taiwanese (zh-TW):', detection.hasTaiwanese);
  console.log('Has Cantonese (zh-HK):', detection.hasCantonese);
  console.log('Default Chinese voice:', detection.defaultChineseVoice?.name);
  console.log('All Chinese voices:', voices.filter(v => v.lang.startsWith('zh-')).map(v => `${v.name} (${v.lang})`));
  console.log('========================');
  
  return detection;
};

// Ensure voices are loaded (call this early in your app)
export const ensureVoicesLoaded = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices();
        resolve(cachedVoices);
      };
      // Timeout fallback after 1 second
      setTimeout(() => {
        if (cachedVoices === null) {
          cachedVoices = window.speechSynthesis.getVoices();
          resolve(cachedVoices);
        }
      }, 1000);
    }
  });
};

// Original functions for compatibility
export const speakWithBrowserSupport = (
  text: string,
  langKey: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null => {
  if (!text || typeof window === 'undefined') return null;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language tag based on langKey
  if (langKey === 'Cantonese') {
    utterance.lang = 'zh-HK';
  } else if (langKey === 'Mandarin' || langKey === '简体中文') {
    utterance.lang = 'zh-CN';
  } else if (langKey === 'Taiwanese') {
    utterance.lang = 'zh-TW';
  } else {
    utterance.lang = 'en-US';
  }
  
  // Get best voice with fallback
  const bestVoice = getVoiceForLanguage(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`✓ Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${langKey}`);
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