// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices - prioritize male voices for English
function getBestVoice(langKey: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) return null;
  
  if (langKey === 'Cantonese') {
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-HK'),
      voices.find(v => v.lang === 'zh-TW'),
      voices.find(v => v.lang.includes('zh')),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  } 
  else if (langKey === '简体中文') {
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-CN'),
      voices.find(v => v.lang === 'zh-Hans'),
      voices.find(v => v.lang.includes('zh')),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
  else {
    // English - prioritize male voices
    const preferredVoices = [
      voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')),
      voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('samantha') === false),
      voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male')),
      voices.find(v => v.lang === 'en-US'),
      voices.find(v => v.lang === 'en-GB'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
}

// Prepare text for TTS
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
  
  // Fix colons and line breaks
  result = result.replace(/:/g, '. ');
  result = result.replace(/：/g, '. ');
  result = result.replace(/\n/g, '. ');
  
  if (langKey === 'Cantonese') {
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
    
    // Convert Chinese news section to English for speech
    result = result.replace(/最新新聞情緒分析/g, 'Latest news sentiment analysis');
    result = result.replace(/共(\d+)篇/g, 'total $1 articles');
    result = result.replace(/整體情緒/g, 'overall sentiment');
    result = result.replace(/正面新聞/g, 'positive news');
    result = result.replace(/負面新聞/g, 'negative news');
    result = result.replace(/中性/g, 'neutral');
    result = result.replace(/篇/g, '');
    result = result.replace(/分數/g, 'score');
    result = result.replace(/新聞摘要/g, 'news summary');
    result = result.replace(/AI新聞分析/g, 'AI news analysis');
    result = result.replace(/詳細分析/g, 'detailed analysis');
  }
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\.\./g, '.');
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
  
  // Cancel any ongoing speech
  if (currentUtterance) {
    window.speechSynthesis.cancel();
  }
  
  // Wait for voices to be loaded
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
  
  // Set voice - prioritize male voices for English
  const bestVoice = getBestVoice(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang})`);
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