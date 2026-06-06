// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices
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
    const preferredVoices = [
      voices.find(v => v.lang === 'en-US'),
      voices.find(v => v.lang === 'en-GB'),
      voices.find(v => v.lang === 'en-AU'),
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
  
  // Add pauses after colons and line breaks
  result = result.replace(/:/g, '. ');
  result = result.replace(/：/g, '. ');
  result = result.replace(/\n/g, '. ');
  
  if (langKey === 'Cantonese') {
    // Replace stars with text
    result = result.replace(/信心評分: (\d+)% 五顆星 \(非常高\)/g, '信心評分 $1 個巴仙，非常高，五星級');
    result = result.replace(/信心評分: (\d+)% 四顆星 \(高\)/g, '信心評分 $1 個巴仙，高，四星級');
    result = result.replace(/信心評分: (\d+)% 三顆星 \(中等\)/g, '信心評分 $1 個巴仙，中等，三星級');
    result = result.replace(/信心評分: (\d+)% 兩顆星 \(低\)/g, '信心評分 $1 個巴仙，低，兩星級');
    result = result.replace(/信心評分: (\d+)% 一顆星 \(極低\)/g, '信心評分 $1 個巴仙，極低，一星級');
    
    // Fix currency and numbers
    result = result.replace(/HK\$/g, '港幣');
    result = result.replace(/NT\$/g, '新台幣');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/(\d+)%/, '$1 個巴仙');
    result = result.replace(/-(\d+\.\d+)%/, '負 $1 個巴仙');
    
    // Fix common phrases
    result = result.replace(/目前股價: /g, '目前股價');
    result = result.replace(/日漲跌幅: /g, '今日升跌');
    result = result.replace(/日內波幅: /g, '日內波幅');
    result = result.replace(/ - /g, '至');
    result = result.replace(/RSI: /g, 'RSI');
    result = result.replace(/整體趨勢: /g, '整體趨勢');
    result = result.replace(/MACD: /g, 'MACD');
    result = result.replace(/趨勢: /g, '趨勢');
    result = result.replace(/波動率: /g, '波動率');
    result = result.replace(/平均成交量: /g, '平均成交量');
    result = result.replace(/目標價: /g, '目標價');
    result = result.replace(/止蝕位: /g, '止蝕位');
    result = result.replace(/風險回報比: /g, '風險回報比例');
    
  } else if (langKey === '简体中文') {
    // Replace stars with text
    result = result.replace(/信心评分: (\d+)% 五颗星 \(非常高\)/g, '信心评分 $1 百分之，非常高，五星级');
    result = result.replace(/信心评分: (\d+)% 四颗星 \(高\)/g, '信心评分 $1 百分之，高，四星级');
    result = result.replace(/信心评分: (\d+)% 三颗星 \(中等\)/g, '信心评分 $1 百分之，中等，三星级');
    result = result.replace(/信心评分: (\d+)% 两颗星 \(低\)/g, '信心评分 $1 百分之，低，两星级');
    result = result.replace(/信心评分: (\d+)% 一颗星 \(极低\)/g, '信心评分 $1 百分之，极低，一星级');
    
    // Fix currency and numbers
    result = result.replace(/HK\$/g, '港币');
    result = result.replace(/NT\$/g, '新台币');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/(\d+)%/, '$1 百分之');
    result = result.replace(/-(\d+\.\d+)%/, '负 $1 百分之');
    
    // Fix common phrases
    result = result.replace(/目前股价: /g, '目前股价');
    result = result.replace(/日涨跌幅: /g, '今日涨跌');
    result = result.replace(/日内波幅: /g, '日内波幅');
    result = result.replace(/ - /g, '至');
    result = result.replace(/RSI: /g, 'RSI');
    result = result.replace(/整体趋势: /g, '整体趋势');
    result = result.replace(/MACD: /g, 'MACD');
    result = result.replace(/趋势: /g, '趋势');
    result = result.replace(/波动率: /g, '波动率');
    result = result.replace(/平均成交量: /g, '平均成交量');
    result = result.replace(/目标价: /g, '目标价');
    result = result.replace(/止损位: /g, '止损位');
    result = result.replace(/风险回报比: /g, '风险回报比例');
    
  } else {
    // English
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, 'Confidence score $1 percent, very high, five stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, 'Confidence score $1 percent, high, four stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, 'Confidence score $1 percent, medium, three stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, 'Confidence score $1 percent, low, two stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, 'Confidence score $1 percent, very low, one star');
    
    // Fix currency
    result = result.replace(/HK\$/g, 'Hong Kong dollars');
    result = result.replace(/NT\$/g, 'New Taiwan dollars');
    result = result.replace(/\$/g, 'US dollars');
    result = result.replace(/(\d+)%/, '$1 percent');
    result = result.replace(/-(\d+\.\d+)%/, 'minus $1 percent');
    
    // Fix common phrases
    result = result.replace(/Current Price: /g, 'Current price');
    result = result.replace(/Daily Change: /g, 'Daily change');
    result = result.replace(/Day Range: /g, 'Day range');
    result = result.replace(/ - /g, ' to ');
    result = result.replace(/RSI: /g, 'RSI');
    result = result.replace(/Overall Trend: /g, 'Overall trend');
    result = result.replace(/MACD: /g, 'MACD');
    result = result.replace(/Trend: /g, 'Trend');
    result = result.replace(/Volatility: /g, 'Volatility');
    result = result.replace(/Average Volume: /g, 'Average volume');
    result = result.replace(/Target Price: /g, 'Target price');
    result = result.replace(/Stop Loss: /g, 'Stop loss');
    result = result.replace(/Risk\/Reward Ratio: /g, 'Risk reward ratio');
  }
  
  // Clean up multiple spaces and punctuation
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\.\./g, '.');
  result = result.replace(/\. \./g, '.');
  result = result.replace(/,\s*\./g, '.');
  result = result.trim();
  
  return result;
}

// Initialize speech synthesis (call once on page load)
export function initSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // Pre-load voices silently
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
  
  // Set voice
  const bestVoice = getBestVoice(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
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