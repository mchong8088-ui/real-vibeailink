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
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
};

const getBestVoice = async (voiceLanguage: string): Promise<SpeechSynthesisVoice | null> => {
  const voices = await waitForVoices();
  
  console.log(`🎤 Looking for ${voiceLanguage} voice among ${voices.length} voices`);
  
  if (voices.length === 0) return null;

  // iOS-specific voice names
  if (voiceLanguage === 'Mandarin') {
    const mandarinVoice = voices.find(v => 
      v.name === 'Ting-Ting' ||
      v.name.includes('Ting') ||
      v.lang === 'zh-CN'
    );
    if (mandarinVoice) return mandarinVoice;
  }
  
  if (voiceLanguage === 'Taiwanese') {
    const taiwaneseVoice = voices.find(v => 
      v.name === 'Mei-Jia' ||
      v.lang === 'zh-TW'
    );
    if (taiwaneseVoice) return taiwaneseVoice;
    // Fallback to Mandarin
    return voices.find(v => v.lang === 'zh-CN');
  }
  
  if (voiceLanguage === 'Cantonese') {
    const cantoneseVoice = voices.find(v => 
      v.name === 'Sin-ji' ||
      v.name.includes('Sin-ji') ||
      v.lang === 'zh-HK'
    );
    if (cantoneseVoice) return cantoneseVoice;
  }
  
  if (voiceLanguage === 'English') {
    const englishVoice = voices.find(v => 
      v.lang === 'en-US' && (v.name === 'Samantha' || v.name === 'Alex')
    );
    if (englishVoice) return englishVoice;
    return voices.find(v => v.lang === 'en-US');
  }
  
  return null;
};

// ============================================
// TEXT CLEANING
// ============================================
const cleanTextForTTS = (text: string, textLanguage: string): string => {
  let result = text;
  
  // Remove emojis
  result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
  result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  result = result.replace(/[⭐📈📉📊⚠️✅📋🔗📤▶▼]/g, '');
  
  // Remove markdown
  result = result.replace(/\*\*|###|##|\*|•/g, '');
  
  // Replace line breaks and colons
  result = result.replace(/\n/g, ' ');
  result = result.replace(/[:：]/g, ' ');
  
  // Handle dashes
  result = result.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/g, '$1至$2');
  result = result.replace(/\s*-\s*/g, ' ');
  
  // Language-specific number formatting
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
  
  // Clean up
  result = result.replace(/\s+/g, ' ');
  return result.trim();
};

// ============================================
// MAIN SPEECH FUNCTION - USE THIS EVERYWHERE!
// ============================================
export async function speak(
  text: string,
  textLanguage: string,  // 'Traditional Chinese', 'Simplified Chinese', 'English'
  voiceLanguage: string,  // 'Cantonese', 'Mandarin', 'Taiwanese', 'English'
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
  
  // Add intro + clean text
  const intro = getIntroMessage(voiceLanguage);
  const cleanedText = cleanTextForTTS(text, textLanguage);
  const fullText = `${intro} ${cleanedText}`;
  
  console.log(`🔊 Speaking (${voiceLanguage}): ${fullText.substring(0, 100)}...`);
  
  const utterance = new SpeechSynthesisUtterance(fullText);
  
  // Set language
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
  
  // Get best voice
  const bestVoice = await getBestVoice(voiceLanguage);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`✓ Using voice: ${bestVoice.name} (${bestVoice.lang})`);
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
  window.speechSynthesis.speak(utterance);
}

// ============================================
// STOP SPEECH
// ============================================
export function stopSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// ============================================
// INITIALIZE (call once on app start)
// ============================================
export function initTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // Warm up speech synthesis
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => window.speechSynthesis.cancel(), 100);
  }
}

// ============================================
// LEGACY COMPATIBILITY (for existing imports)
// ============================================
// These functions map to the new ones so old code still works
export const speakText = speak;
export const stopSpeaking = stopSpeech;
export const speakWithLanguage = speak;
export const speakWithBrowserSupport = speak;