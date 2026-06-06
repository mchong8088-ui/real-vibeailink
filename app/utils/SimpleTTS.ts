// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices and select the best one
function getBestVoice(langKey: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (langKey === 'Cantonese') {
    // Try Cantonese voices in priority order
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Ting-Ting')),
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Sin-Ji')),
      voices.find(v => v.lang === 'zh-HK'),
      voices.find(v => v.lang === 'zh-TW'),
      voices.find(v => v.lang === 'zh-HK' || v.lang === 'zh-TW'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  } 
  else if (langKey === '简体中文') {
    // Try Mandarin (Simplified Chinese) voices - mainland China accent
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Ting-Ting')), // Female Mandarin
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Yun-Yang')), // Male Mandarin
      voices.find(v => v.lang === 'zh-CN'),
      voices.find(v => v.lang === 'zh-TW'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
  else {
    // English - prefer male voice
    const preferredVoices = [
      voices.find(v => v.lang === 'en-US' && v.name.includes('Google UK English Male')),
      voices.find(v => v.lang === 'en-US' && v.name.includes('Samantha') === false && v.name.includes('Female') === false),
      voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male')),
      voices.find(v => v.lang === 'en-US'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
}

// Prepare text for TTS - remove emojis and format properly
function prepareTextForTTS(text: string, langKey: string): string {
  let result = text;
  
  // Remove all emojis
  result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
  result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  result = result.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
  result = result.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
  result = result.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
  result = result.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
  result = result.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
  result = result.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
  result = result.replace(/[⭐️⭐️⭐️⭐️⭐️]/g, '');
  result = result.replace(/[⭐]/g, '');
  result = result.replace(/📈/g, '');
  result = result.replace(/📉/g, '');
  result = result.replace(/📊/g, '');
  result = result.replace(/🎯/g, '');
  result = result.replace(/⚠️/g, '');
  result = result.replace(/✅/g, '');
  
  if (langKey === 'Cantonese') {
    // Convert confidence score stars to Cantonese colloquial
    result = result.replace(/信心評分: (\d+)% 五顆星 \(非常高\)/g, '我比呢隻股信心非常高 $1 個巴仙，同埋五粒星');
    result = result.replace(/信心評分: (\d+)% 四顆星 \(高\)/g, '我比呢隻股信心高 $1 個巴仙，同埋四粒星');
    result = result.replace(/信心評分: (\d+)% 三顆星 \(中等\)/g, '我比呢隻股信心中等 $1 個巴仙，同埋三粒星');
    result = result.replace(/信心評分: (\d+)% 兩顆星 \(低\)/g, '我比呢隻股信心低 $1 個巴仙，同埋兩粒星');
    result = result.replace(/信心評分: (\d+)% 一顆星 \(極低\)/g, '我比呢隻股信心極低 $1 個巴仙，同埋一粒星');
    
    // Replace other common patterns
    result = result.replace(/目前股價: /g, '而家股價係');
    result = result.replace(/日漲跌幅: /g, '今日升跌');
    result = result.replace(/日內波幅: /g, '今日高低');
    result = result.replace(/整體趨勢: /g, '整體趨勢係');
    result = result.replace(/RSI: /g, 'RSI係');
    result = result.replace(/MACD: /g, 'MACD係');
    result = result.replace(/目標價: /g, '目標價係');
    result = result.replace(/止蝕位: /g, '止蝕位係');
    result = result.replace(/風險回報比: /g, '風險回報比例係');
    
    // Remove markdown and formatting
    result = result.replace(/\*\*/g, '');
    result = result.replace(/###/g, '');
    result = result.replace(/##/g, '');
    result = result.replace(/\*/g, '');
    result = result.replace(/•/g, '點');
    result = result.replace(/➡️/g, '向右');
    
  } else if (langKey === '简体中文') {
    // Convert confidence score stars to Mandarin colloquial
    result = result.replace(/信心评分: (\d+)% 五颗星 \(非常高\)/g, '我对这只股票信心非常高 $1 百分之，五颗星');
    result = result.replace(/信心评分: (\d+)% 四颗星 \(高\)/g, '我对这只股票信心高 $1 百分之，四颗星');
    result = result.replace(/信心评分: (\d+)% 三颗星 \(中等\)/g, '我对这只股票信心中等 $1 百分之，三颗星');
    result = result.replace(/信心评分: (\d+)% 两颗星 \(低\)/g, '我对这只股票信心低 $1 百分之，两颗星');
    result = result.replace(/信心评分: (\d+)% 一颗星 \(极低\)/g, '我对这只股票信心极低 $1 百分之，一颗星');
    
    // Remove markdown
    result = result.replace(/\*\*/g, '');
    result = result.replace(/###/g, '');
    result = result.replace(/##/g, '');
    result = result.replace(/\*/g, '');
    result = result.replace(/•/g, '点');
    
  } else {
    // English - convert to conversational tone
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, "I rate this stock 5 stars with $1 percent confidence!");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, "I rate this stock 4 stars with $1 percent confidence!");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, "I rate this stock 3 stars with $1 percent confidence.");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, "I rate this stock 2 stars with $1 percent confidence. Be careful.");
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, "I rate this stock only 1 star with $1 percent confidence. High risk!");
    
    // Remove emojis and format
    result = result.replace(/[⭐]/g, '');
    result = result.replace(/\*\*/g, '');
    result = result.replace(/###/g, '');
    result = result.replace(/##/g, '');
    result = result.replace(/\*/g, '');
    result = result.replace(/•/g, 'dot');
    result = result.replace(/➡️/g, 'to');
  }
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');
  result = result.trim();
  
  return result;
}

export async function speakText(text: string, langKey: string, onEnd?: () => void) {
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
  
  // Select best available voice
  const bestVoice = getBestVoice(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang})`);
  }
  
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}