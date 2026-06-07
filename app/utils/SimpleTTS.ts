// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices
function getBestVoice(langKey: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  console.log("🎤 Available voices:", voices.map(v => `${v.name} (${v.lang})`).join(', '));
  
  if (voices.length === 0) return null;
  
  if (langKey === 'Cantonese') {
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-HK'),
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Ting-Ting')),
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Sin-Ji')),
      voices.find(v => v.lang === 'zh-TW'),
      voices.find(v => v.lang.includes('zh')),
    ];
    const selected = preferredVoices.find(v => v !== undefined);
    console.log("🎤 Selected Cantonese voice:", selected?.name, selected?.lang);
    return selected || null;
  } 
  else if (langKey === '简体中文') {
    // Mandarin - specifically use zh-CN
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-CN'),
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Ting-Ting')),
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Yun-Yang')),
      voices.find(v => v.lang === 'zh-TW'),
      voices.find(v => v.lang.includes('zh')),
    ];
    const selected = preferredVoices.find(v => v !== undefined);
    console.log("🎤 Selected Mandarin voice:", selected?.name, selected?.lang);
    return selected || null;
  }
  else {
    // English - try different voices, avoid robotic ones
    const preferredVoices = [
      voices.find(v => v.lang === 'en-US' && v.name === 'Samantha'),      // Female, natural
      voices.find(v => v.lang === 'en-US' && v.name === 'Google US English'),
      voices.find(v => v.lang === 'en-US' && v.name.includes('Alex')),    // Male
      voices.find(v => v.lang === 'en-GB' && v.name === 'Daniel'),        // UK Male
      voices.find(v => v.lang === 'en-US'),                               // Any US English
      voices.find(v => v.lang === 'en-GB'),                               // Any UK English
    ];
    const selected = preferredVoices.find(v => v !== undefined);
    console.log("🎤 Selected English voice:", selected?.name, selected?.lang);
    return selected || null;
  }
}

// Prepare text for TTS - Remove "fullstop" and fix punctuation
function prepareTextForTTS(text: string, langKey: string): string {
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
  
  // Replace periods with natural pauses - remove "fullstop" issue
  result = result.replace(/\. /g, '. ');
  result = result.replace(/\.\./g, '.');
  
  // Replace colons with natural pauses (not saying "colon")
  result = result.replace(/:/g, ', ');
  result = result.replace(/：/g, ', ');
  
  // Replace line breaks with spaces
  result = result.replace(/\n/g, '. ');
  
  if (langKey === 'Cantonese') {
    // Replace stars with text
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
    
  } else if (langKey === '简体中文') {
    // Mandarin - Simplified Chinese
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
  
  // Clean up multiple spaces and punctuation
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\. \./g, '.');
  result = result.trim();
  
  return result;
}

// Initialize speech synthesis
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

export async function speakText(text: string, langKey: string, onEnd?: () => void) {
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
  
  const processedText = prepareTextForTTS(text, langKey);
  const utterance = new SpeechSynthesisUtterance(processedText);
  
  // Set language
  if (langKey === 'Cantonese') {
    utterance.lang = 'zh-HK';
  } else if (langKey === '简体中文') {
    utterance.lang = 'zh-CN';
  } else {
    utterance.lang = 'en-US';
  }
  
  const bestVoice = getBestVoice(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`🎤 Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${langKey}`);
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