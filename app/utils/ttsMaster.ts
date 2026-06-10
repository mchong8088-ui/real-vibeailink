// app/utils/ttsMaster.ts - SINGLE SOURCE OF TRUTH for all TTS

let currentUtterance: SpeechSynthesisUtterance | null = null;

// ============================================
// INTRO MESSAGES (Michael & Teresa)
// ============================================
const getIntroMessage = (voiceLanguage: string): string => {
  switch (voiceLanguage) {
    case 'Cantonese':
      return "你好，我哋係米高和杜麗莎，你嘅財務和市場分析員，好高興為你報告。";
    case 'Mandarin':
      return "你好，我们是米高和杜丽莎，你的财务和市场分析师，很高兴为你报告。";
    case 'Taiwanese':
      return "你好，我們是米高和杜麗莎，你的財務和市場分析員，很高興為你報告。";
    default:
      return "Hello, this is Michael and Teresa, your Finance and Market Analysts, here to give you the report.";
  }
};

// ============================================
// VOICE LOADING & DETECTION
// ============================================
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }
    
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log(`✅ Voices ready: ${voices.length} voices`);
        resolve(voices);
      } else {
        setTimeout(checkVoices, 100);
      }
    };
    
    checkVoices();
    
    // Also listen for onvoiceschanged
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      }
    };
    
    // Timeout fallback
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      resolve(voices);
    }, 2000);
  });
};

const refreshVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
};

const getBestVoice = async (voiceLanguage: string): Promise<SpeechSynthesisVoice | null> => {
  const voices = await waitForVoices();
  
  console.log(`🎤 Looking for ${voiceLanguage} voice`);
  
  // Log all Chinese voices
  const chineseVoices = voices.filter(v => v.lang.startsWith('zh-'));
  console.log('=== Chinese voices available ===');
  chineseVoices.forEach(v => {
    console.log(`Name: "${v.name}", Lang: "${v.lang}", URI: "${v.voiceURI}"`);
  });
  
  // For Mandarin - try multiple methods
  if (voiceLanguage === 'Mandarin') {
    // Try by exact name first
    let voice = chineseVoices.find(v => v.name === '婷婷');
    if (!voice) voice = chineseVoices.find(v => v.name === 'Ting-Ting');
    if (!voice) voice = chineseVoices.find(v => v.lang === 'zh-CN');
    if (!voice) voice = chineseVoices.find(v => v.lang.startsWith('zh-CN'));
    
    if (voice) {
      console.log(`✅ SELECTED Mandarin: "${voice.name}" (${voice.lang})`);
      return voice;
    }
  }
  
  // For Taiwanese
  if (voiceLanguage === 'Taiwanese') {
    let voice = chineseVoices.find(v => v.name === '美佳');
    if (!voice) voice = chineseVoices.find(v => v.name === 'Mei-Jia');
    if (!voice) voice = chineseVoices.find(v => v.lang === 'zh-TW');
    
    if (voice) {
      console.log(`✅ SELECTED Taiwanese: "${voice.name}" (${voice.lang})`);
      return voice;
    }
    // Fallback to Mandarin
    const mandarinVoice = chineseVoices.find(v => v.lang === 'zh-CN');
    if (mandarinVoice) {
      console.log(`⚠️ Fallback to Mandarin for Taiwanese`);
      return mandarinVoice;
    }
  }
  
  // For Cantonese
  if (voiceLanguage === 'Cantonese') {
    let voice = chineseVoices.find(v => v.name === '善怡');
    if (!voice) voice = chineseVoices.find(v => v.name === 'Sin-ji');
    if (!voice) voice = chineseVoices.find(v => v.lang === 'zh-HK');
    
    if (voice) {
      console.log(`✅ SELECTED Cantonese: "${voice.name}" (${voice.lang})`);
      return voice;
    }
  }
  
  // For English
  if (voiceLanguage === 'English') {
    let voice = voices.find(v => v.lang === 'en-US');
    if (voice) {
      console.log(`✅ SELECTED English: "${voice.name}"`);
      return voice;
    }
  }
  
  console.log(`❌ No voice found for ${voiceLanguage}`);
  return null;
};

// ============================================
// TEXT CLEANING
// ============================================
const cleanTextForTTS = (text: string, textLanguage: string): string => {
  let result = text;
  
  result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
  result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  result = result.replace(/[⭐📈📉📊⚠️✅📋🔗📤▶▼]/g, '');
  result = result.replace(/\*\*|###|##|\*|•/g, '');
  result = result.replace(/\n/g, ' ');
  result = result.replace(/[:：]/g, ' ');
  result = result.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/g, '$1至$2');
  result = result.replace(/\s*-\s*/g, ' ');
  
  if (textLanguage === 'Traditional Chinese') {
    result = result.replace(/(\d+)%/, '$1 個巴仙');
    result = result.replace(/-(\d+\.\d+)%/, '負 $1 個巴仙');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/HK\$/g, '港幣');
    result = result.replace(/NT\$/g, '新台幣');
  } else if (textLanguage === 'Simplified Chinese') {
    result = result.replace(/(\d+)%/, '$1 百分之');
    result = result.replace(/-(\d+\.\d+)%/, '负 $1 百分之');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/HK\$/g, '港币');
    result = result.replace(/NT\$/g, '新台币');
  } else {
    result = result.replace(/(\d+)%/, '$1 percent');
    result = result.replace(/-(\d+\.\d+)%/, 'minus $1 percent');
    result = result.replace(/\$/g, 'US dollars');
    result = result.replace(/HK\$/g, 'Hong Kong dollars');
    result = result.replace(/NT\$/g, 'New Taiwan dollars');
  }
  
  result = result.replace(/\s+/g, ' ');
  return result.trim();
};

// ============================================
// MAIN SPEECH FUNCTION
// ============================================
export async function speak(
  text: string,
  textLanguage: string,
  voiceLanguage: string,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.log('Speech synthesis not supported');
    return;
  }
  
  // Cancel any ongoing speech
  if (currentUtterance) {
    window.speechSynthesis.cancel();
  }
  
  // CRITICAL: Wait for voices to be fully loaded
  await waitForVoices();
  
  const intro = getIntroMessage(voiceLanguage);
  const cleanedText = cleanTextForTTS(text, textLanguage);
  const fullText = `${intro} ${cleanedText}`;
  
  console.log(`🔊 Speaking (${voiceLanguage}): ${fullText.substring(0, 100)}...`);
  
  const utterance = new SpeechSynthesisUtterance(fullText);
  
  // Set language tag
  switch (voiceLanguage) {
    case 'Cantonese':
      utterance.lang = 'zh-HK';
      break;
    case 'Mandarin':
      utterance.lang = 'zh-CN';
      break;
    case 'Taiwanese':
      utterance.lang = 'zh-TW';
      break;
    default:
      utterance.lang = 'en-US';
  }
  
  // Find and set the voice BEFORE speaking
  const allVoices = window.speechSynthesis.getVoices();
  let selectedVoice: SpeechSynthesisVoice | null = null;
  
  // Explicit voice selection
  if (voiceLanguage === 'Cantonese') {
    selectedVoice = allVoices.find(v => v.name === '善怡' || v.name === 'Sin-ji' || v.lang === 'zh-HK');
  } else if (voiceLanguage === 'Mandarin') {
    selectedVoice = allVoices.find(v => v.name === '婷婷' || v.name === 'Ting-Ting' || v.lang === 'zh-CN');
  } else if (voiceLanguage === 'Taiwanese') {
    selectedVoice = allVoices.find(v => v.name === '美佳' || v.name === 'Mei-Jia' || v.lang === 'zh-TW');
  } else {
    selectedVoice = allVoices.find(v => v.lang === 'en-US');
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`✓ Selected voice: "${selectedVoice.name}" (${selectedVoice.lang})`);
  } else {
    console.log(`⚠️ No matching voice found for ${voiceLanguage}`);
  }
  
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1;
  
  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech error:', event);
    currentUtterance = null;
    onEnd?.();
  };
  
  currentUtterance = utterance;
  
  // CRITICAL: Small delay before speaking to ensure voice is set
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
}

export function stopSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function initTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => window.speechSynthesis.cancel(), 100);
    waitForVoices();
  }
}

// Legacy exports
export const speakText = speak;
export const stopSpeaking = stopSpeech;
export const speakWithLanguage = speak;
export const speakWithBrowserSupport = speak;

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined') return [];
  return refreshVoices();
};

export const logAvailableVoices = () => {
  if (typeof window === 'undefined') return;
  const voices = getAvailableVoices();
  console.log('=== Available Voices ===');
  voices.forEach(v => console.log(`- "${v.name}" (${v.lang})`));
  console.log('=======================');
};