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

// Add pauses after punctuation
function addPauses(text: string): string {
  // Add pause after periods, colons, and line breaks
  let result = text;
  
  // Add pause after section titles (Summary, Technical Analysis, etc.)
  result = result.replace(/(Summary|Technical Analysis|Fundamental Analysis|News & Risk Analysis|Specific Bullish Factors|Specific Bearish Factors|Trading Advice|Final Recommendation & Risk Rating)/g, '$1。');
  result = result.replace(/(摘要|技術分析|基本面分析|新聞與風險分析|具體看好因素|具體看淡因素|買賣建議|最終建議及風險評級)/g, '$1。');
  result = result.replace(/(摘要|技术分析|基本面分析|新闻与风险分析|具体看好因素|具体看淡因素|买卖建议|最终建议及风险评级)/g, '$1。');
  
  // Add pause after each sentence
  result = result.replace(/\. /g, '. ');
  result = result.replace(/。 /g, '。 ');
  result = result.replace(/\n/g, '。 ');
  
  return result;
}
// app/utils/SimpleTTS.ts
// Add pauses after punctuation and fix the Trend: issue
function addPauses(text: string): string {
  let result = text;
  
  // Add period after "Trend:" when followed by newline
  result = result.replace(/Trend:\n/g, 'Trend. ');
  result = result.replace(/趋势:\n/g, '趋势。 ');
  result = result.replace(/趨勢:\n/g, '趨勢。 ');
  
  // Add period after colons that are followed by a newline or space
  result = result.replace(/([A-Za-z]+):\n/g, '$1. ');
  result = result.replace(/([\\u4e00-\\u9fa5]+):\n/g, '$1。 ');
  
  // Add pause after section numbers
  result = result.replace(/(\d+\.\s+[A-Za-z\s]+):/g, '$1. ');
  result = result.replace(/(\d+\.\s+[\\u4e00-\\u9fa5\s]+):/g, '$1。 ');
  
  // Add explicit period after each line that doesn't end with punctuation
  result = result.replace(/([^.!?。！？]\n)/g, '$1. ');
  
  // Add pause after each numbered section
  result = result.replace(/(\d+\.\s+[^\n]+)\n/g, '$1. ');
  
  return result;
}

// Prepare text for TTS - enhanced version
function prepareTextForTTS(text: string, langKey: string): string {
  let result = text;
  
  // First, add pauses
  result = addPauses(result);
  
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
  
  if (langKey === 'Cantonese') {
    // Replace stars with text
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐⭐⭐ \(非常高\)/g, '信心評分 $1 個巴仙，非常高，五星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐⭐ \(高\)/g, '信心評分 $1 個巴仙，高，四星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐ \(中等\)/g, '信心評分 $1 個巴仙，中等，三星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐ \(低\)/g, '信心評分 $1 個巴仙，低，兩星級');
    result = result.replace(/信心評分: (\d+)% ⭐ \(極低\)/g, '信心評分 $1 個巴仙，極低，一星級');
    
    // Add reading for numbers
    result = result.replace(/1\. /g, '第一點 ');
    result = result.replace(/2\. /g, '第二點 ');
    result = result.replace(/3\. /g, '第三點 ');
    result = result.replace(/4\. /g, '第四點 ');
    result = result.replace(/5\. /g, '第五點 ');
    result = result.replace(/6\. /g, '第六點 ');
    result = result.replace(/7\. /g, '第七點 ');
    result = result.replace(/8\. /g, '第八點 ');
    
    // Fix colon readings
    result = result.replace(/:/g, '係');
    result = result.replace(/：/g, '係');
    
  } else if (langKey === '简体中文') {
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐⭐⭐ \(非常高\)/g, '信心评分 $1 百分之，非常高，五星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐⭐ \(高\)/g, '信心评分 $1 百分之，高，四星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐ \(中等\)/g, '信心评分 $1 百分之，中等，三星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐ \(低\)/g, '信心评分 $1 百分之，低，两星级');
    result = result.replace(/信心评分: (\d+)% ⭐ \(极低\)/g, '信心评分 $1 百分之，极低，一星级');
    
    result = result.replace(/1\. /g, '第一点 ');
    result = result.replace(/2\. /g, '第二点 ');
    result = result.replace(/3\. /g, '第三点 ');
    result = result.replace(/4\. /g, '第四点 ');
    result = result.replace(/5\. /g, '第五点 ');
    result = result.replace(/6\. /g, '第六点 ');
    result = result.replace(/7\. /g, '第七点 ');
    result = result.replace(/8\. /g, '第八点 ');
    
    result = result.replace(/:/g, '是');
    result = result.replace(/：/g, '是');
    
  } else {
    // English - replace stars with text
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, 'Confidence score $1 percent, very high, five stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, 'Confidence score $1 percent, high, four stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, 'Confidence score $1 percent, medium, three stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, 'Confidence score $1 percent, low, two stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, 'Confidence score $1 percent, very low, one star');
    
    // Add reading for numbers (optional, for clarity)
    result = result.replace(/1\. /g, 'Number one ');
    result = result.replace(/2\. /g, 'Number two ');
    result = result.replace(/3\. /g, 'Number three ');
    result = result.replace(/4\. /g, 'Number four ');
    result = result.replace(/5\. /g, 'Number five ');
    result = result.replace(/6\. /g, 'Number six ');
    result = result.replace(/7\. /g, 'Number seven ');
    result = result.replace(/8\. /g, 'Number eight ');
  }
  
  // Add periods at the end of each line for better pauses
  result = result.replace(/\n/g, '. ');
  
  // Clean up multiple spaces and punctuation
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\.\./g, '.');
  result = result.replace(/\. \./g, '.');
  result = result.replace(/,\s*\./g, '.');
  result = result.trim();
  
  return result;
}
// Prepare text for TTS
function prepareTextForTTS(text: string, langKey: string): string {
  let result = text;
  
  // First, add pauses
  result = addPauses(result);
  
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
  
  if (langKey === 'Cantonese') {
    // Replace stars with text
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐⭐⭐ \(非常高\)/g, '信心評分 $1 個巴仙，非常高，五星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐⭐ \(高\)/g, '信心評分 $1 個巴仙，高，四星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐⭐ \(中等\)/g, '信心評分 $1 個巴仙，中等，三星級');
    result = result.replace(/信心評分: (\d+)% ⭐⭐ \(低\)/g, '信心評分 $1 個巴仙，低，兩星級');
    result = result.replace(/信心評分: (\d+)% ⭐ \(極低\)/g, '信心評分 $1 個巴仙，極低，一星級');
    
    result = result.replace(/目前股價: /g, '目前股價');
    result = result.replace(/日漲跌幅: /g, '今日升跌');
    result = result.replace(/-(\d+\.\d+)%/, '負 $1 個巴仙');
    result = result.replace(/日內波幅: /g, '日內波幅');
    result = result.replace(/ - /g, '至');
    result = result.replace(/HK\$/g, '港幣');
    result = result.replace(/NT\$/g, '新台幣');
    result = result.replace(/\$/g, '美元');
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
    // Replace stars with text for Simplified Chinese
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐⭐⭐ \(非常高\)/g, '信心评分 $1 百分之，非常高，五星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐⭐ \(高\)/g, '信心评分 $1 百分之，高，四星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐⭐ \(中等\)/g, '信心评分 $1 百分之，中等，三星级');
    result = result.replace(/信心评分: (\d+)% ⭐⭐ \(低\)/g, '信心评分 $1 百分之，低，两星级');
    result = result.replace(/信心评分: (\d+)% ⭐ \(极低\)/g, '信心评分 $1 百分之，极低，一星级');
    
    result = result.replace(/目前股价: /g, '目前股价');
    result = result.replace(/日涨跌幅: /g, '今日涨跌');
    result = result.replace(/-(\d+\.\d+)%/, '负 $1 百分之');
    result = result.replace(/日内波幅: /g, '日内波幅');
    result = result.replace(/ - /g, '至');
    result = result.replace(/HK\$/g, '港币');
    result = result.replace(/NT\$/g, '新台币');
    result = result.replace(/\$/g, '美元');
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
    // English - replace stars with text
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, 'Confidence score $1 percent, very high, five stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, 'Confidence score $1 percent, high, four stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, 'Confidence score $1 percent, medium, three stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, 'Confidence score $1 percent, low, two stars');
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, 'Confidence score $1 percent, very low, one star');
    
    result = result.replace(/Current Price: /g, 'Current price');
    result = result.replace(/Daily Change: /g, 'Daily change');
    result = result.replace(/-(\d+\.\d+)%/, 'minus $1 percent');
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
  
  // Add explicit pauses between lines
  result = result.replace(/\n\n/g, '. ');
  result = result.replace(/\n/g, '. ');
  
  // Clean up multiple spaces and punctuation
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\.\./g, '.');
  result = result.replace(/\. \./g, '.');
  result = result.trim();
  
  return result;
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