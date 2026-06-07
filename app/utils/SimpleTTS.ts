// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices
function getBestVoice(voiceLanguage: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  console.log("🎤 Available voices:", voices.map(v => `${v.name} (${v.lang})`).join(', '));
  
  if (voices.length === 0) return null;
  
  if (voiceLanguage === 'Cantonese') {
    // ONLY Hong Kong Cantonese
    const cantoneseVoice = voices.find(v => v.lang === 'zh-HK');
    if (cantoneseVoice) {
      console.log("🎤 Found Cantonese voice:", cantoneseVoice.name);
      return cantoneseVoice;
    }
    console.log("🎤 No Cantonese voice found, using default with zh-HK");
    return null;
  } 
  else if (voiceLanguage === 'Mandarin') {
    // ONLY Mainland Mandarin
    const mandarinVoice = voices.find(v => v.lang === 'zh-CN');
    if (mandarinVoice) {
      console.log("🎤 Found Mandarin voice:", mandarinVoice.name);
      return mandarinVoice;
    }
    console.log("🎤 No Mandarin voice found, using default with zh-CN");
    return null;
  }
  else {
    // English - try natural voices first
    const englishVoice = voices.find(v => 
      v.lang === 'en-US' && (v.name === 'Samantha' || v.name === 'Alex' || v.name === 'Google US English')
    );
    if (englishVoice) {
      console.log("🎤 Found English voice:", englishVoice.name);
      return englishVoice;
    }
    return voices.find(v => v.lang === 'en-US') || null;
  }
}

// Prepare text for TTS - Remove "fullstop" issue
function prepareTextForTTS(text: string, textLanguage: string): string {
  let result = text;
  
  // Remove all emojis
  result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
  result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  result = result.replace(/[⭐]/g, '');
  result = result.replace(/📈/g, '');
  result = result.replace(/📉/g, '');
  result = result.replace(/📊/g, '');
  result = result.replace(/⚠️/g, '');
  result = result.replace(/✅/g, '');
  result = result.replace(/📋/g, '');
  result = result.replace(/🔗/g, '');
  result = result.replace(/📤/g, '');
  result = result.replace(/▶/g, '');
  result = result.replace(/▼/g, '');
  
  // Remove markdown formatting
  result = result.replace(/\*\*/g, '');
  result = result.replace(/###/g, '');
  result = result.replace(/##/g, '');
  result = result.replace(/\*/g, '');
  result = result.replace(/•/g, '');
  
  // Fix punctuation - remove "fullstop" issue
  result = result.replace(/\. /g, '. ');
  result = result.replace(/\.\./g, '.');
  result = result.replace(/:/g, ', ');
  result = result.replace(/：/g, ', ');
  result = result.replace(/\n/g, '. ');
  
  if (textLanguage === 'Cantonese') {
    result = result.replace(/信心評分: (\d+)% 五顆星 \(非常高\)/g, '信心評分 $1 個巴仙，非常高，五星級');
    result = result.replace(/信心評分: (\d+)% 四顆星 \(高\)/g, '信心評分 $1 個巴仙，高，四星級');
    result = result.replace(/信心評分: (\d+)% 三顆星 \(中等\)/g, '信心評分 $1 個巴仙，中等，三星級');
    result = result.replace(/信心評分: (\d+)% 兩顆星 \(低\)/g, '信心評分 $1 個巴仙，低，兩星級');
    result = result.replace(/信心評分: (\d+)% 一顆星 \(極低\)/g, '信心評分 $1 個巴仙，極低，一星級');
    
    result = result.replace(/HK\$/g, '港幣');
    result = result.replace(/NT\$/g, '新台幣');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/(\d+)%/, '$1 個巴仙');
    result = result.replace(/-(\d+\.\d+)%/, '負 $1 個巴仙');
    result = result.replace(/ - /g, '至');
    
  } else if (textLanguage === '简体中文') {
    result = result.replace(/信心评分: (\d+)% 五颗星 \(非常高\)/g, '信心评分 $1 百分之，非常高，五星级');
    result = result.replace(/信心评分: (\d+)% 四颗星 \(高\)/g, '信心评分 $1 百分之，高，四星级');
    result = result.replace(/信心评分: (\d+)% 三颗星 \(中等\)/g, '信心评分 $1 百分之，中等，三星级');
    result = result.replace(/信心评分: (\d+)% 两颗星 \(低\)/g, '信心评分 $1 百分之，低，两星级');
    result = result.replace(/信心评分: (\d+)% 一颗星 \(极低\)/g, '信心评分 $1 百分之，极低，一星级');
    
    result = result.replace(/HK\$/g, '港币');
    result = result.replace(/NT\$/g, '新台币');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/(\d+)%/, '$1 百分之');
    result = result.replace(/-(\d+\.\d+)%/, '负 $1 百分之');
    result = result.replace(/ - /g, '至');
    
  } else {
    // English
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, 'Confidence score $1 percent, very high, five stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, 'Confidence score $1 percent, high, four stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, 'Confidence score $1 percent, medium, three stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, 'Confidence score $1 percent, low, two stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, 'Confidence score $1 percent, very low, one star');
    
    result = result.replace(/HK\$/g, 'Hong Kong dollars');
    result = result.replace(/NT\$/g, 'New Taiwan dollars');
    result = result.replace(/\$/g, 'US dollars');
    result = result.replace(/(\d+)%/, '$1 percent');
    result = result.replace(/-(\d+\.\d+)%/, 'minus $1 percent');
    result = result.replace(/ - /g, ' to ');
  }
  
  result = result.replace(/\s+/g, ' ');
  result = result.trim();
  
  return result;
}

export function initSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => {
      window.speechSynthesis.cancel();
    }, 100);
  }
}

export async function speakText(text: string, textLanguage: string, voiceLanguage: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.log('Speech synthesis not supported');
    return;
  }
  
  if (currentUtterance) {
    window.speechSynthesis.cancel();
  }
  
  if (window.speechSynthesis.getVoices().length === 0) {
    await new Promise<void>((resolve) => {
      window.speechSynthesis.onvoiceschanged = () => resolve();
    });
  }
  
  const processedText = prepareTextForTTS(text, textLanguage);
  const utterance = new SpeechSynthesisUtterance(processedText);
  
  // IMPORTANT: Use voiceLanguage for the voice (not textLanguage)
  if (voiceLanguage === 'Cantonese') {
    utterance.lang = 'zh-HK';
  } else if (voiceLanguage === 'Mandarin') {
    utterance.lang = 'zh-CN';
  } else {
    utterance.lang = 'en-US';
  }
  
  const bestVoice = getBestVoice(voiceLanguage);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`🎤 Using voice: ${bestVoice.name} (${bestVoice.lang}) for voice language: ${voiceLanguage}`);
  } else {
    console.log(`🎤 Using default voice for ${utterance.lang}`);
  }
  
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1;
  
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech error:', event);
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}