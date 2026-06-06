// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get available voices and select the best one
function getBestVoice(langKey: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (langKey === 'Cantonese') {
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Ting-Ting')),
      voices.find(v => v.lang === 'zh-HK' && v.name.includes('Sin-Ji')),
      voices.find(v => v.lang === 'zh-HK'),
      voices.find(v => v.lang === 'zh-TW'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  } 
  else if (langKey === '简体中文') {
    const preferredVoices = [
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Ting-Ting')),
      voices.find(v => v.lang === 'zh-CN' && v.name.includes('Yun-Yang')),
      voices.find(v => v.lang === 'zh-CN'),
      voices.find(v => v.lang === 'zh-TW'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
  else {
    const preferredVoices = [
      voices.find(v => v.lang === 'en-US' && v.name.includes('Google UK English Male')),
      voices.find(v => v.lang === 'en-US' && !v.name.includes('Female')),
      voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male')),
      voices.find(v => v.lang === 'en-US'),
    ];
    return preferredVoices.find(v => v !== undefined) || null;
  }
}

// Prepare text for TTS - Cantonese friendly
function prepareTextForTTS(text: string, langKey: string): string {
  let result = text;
  
  // Remove all emojis and special characters
  result = result.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
  result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  result = result.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
  result = result.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
  result = result.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
  result = result.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
  result = result.replace(/📋/g, '');
  result = result.replace(/[⭐]/g, '');
  result = result.replace(/📈/g, '');
  result = result.replace(/📉/g, '');
  result = result.replace(/📊/g, '');
  result = result.replace(/⚠️/g, '');
  result = result.replace(/✅/g, '');
  result = result.replace(/▶/g, '');
  result = result.replace(/▼/g, '');
  
  // Remove markdown formatting
  result = result.replace(/\*\*/g, '');
  result = result.replace(/###/g, '');
  result = result.replace(/##/g, '');
  result = result.replace(/\*/g, '');
  result = result.replace(/•/g, '點');
  
  if (langKey === 'Cantonese') {
    // Fix hyphen/dash reading
    result = result.replace(/(\d+)%/, '$1個巴仙');
    result = result.replace(/(\d+)%/, '$1個巴仙');
    
    // Fix date and time format
    result = result.replace(/(\d+)\/(\d+)\/(\d+)/g, '$1年$2月$3日');
    
    // Fix confidence score
    result = result.replace(/信心評分: (\d+)% 五顆星 \(非常高\)/g, '我比呢隻股信心非常高，$1個巴仙，五粒星');
    result = result.replace(/信心評分: (\d+)% 四顆星 \(高\)/g, '我比呢隻股信心高，$1個巴仙，四粒星');
    result = result.replace(/信心評分: (\d+)% 三顆星 \(中等\)/g, '我比呢隻股信心中等，$1個巴仙，三粒星');
    result = result.replace(/信心評分: (\d+)% 兩顆星 \(低\)/g, '我比呢隻股信心低，$1個巴仙，兩粒星');
    result = result.replace(/信心評分: (\d+)% 一顆星 \(極低\)/g, '我比呢隻股信心極低，$1個巴仙，一粒星');
    
    // Fix section titles to add numbers
    result = result.replace(/摘要/g, '第一，摘要');
    result = result.replace(/技術分析/g, '第二，技術分析');
    result = result.replace(/基本面分析/g, '第三，基本面分析');
    result = result.replace(/新聞與風險分析/g, '第四，新聞與風險分析');
    result = result.replace(/具體看好因素/g, '第五，看好因素');
    result = result.replace(/具體看淡因素/g, '第六，看淡因素');
    result = result.replace(/買賣建議/g, '第七，買賣建議');
    result = result.replace(/最終建議及風險評級/g, '第八，最終建議同風險評級');
    
    // Fix common phrases
    result = result.replace(/目前股價: /g, '目前股價係');
    result = result.replace(/日漲跌幅: /g, '今日升跌');
    result = result.replace(/-(\d+\.\d+)%/, '負$1個巴仙');
    result = result.replace(/\+(\d+\.\d+)%/, '正$1個巴仙');
    result = result.replace(/日內波幅: /g, '日內波幅係');
    result = result.replace(/ - /g, '至');
    result = result.replace(/HK\$/g, '港幣');
    result = result.replace(/NT\$/g, '新台幣');
    result = result.replace(/\$/g, '美元');
    result = result.replace(/RSI: /g, 'RSI係');
    result = result.replace(/整體趨勢: /g, '整體趨勢係');
    
    // Fix MACD and analysis text
    result = result.replace(/MACD: 看淡 - 看淡信號，空頭動能增強/g, 'MACD係看淡，屬看淡信號，空頭動能增強');
    result = result.replace(/MACD: 看好 - 看好信號，多頭動能增強/g, 'MACD係看好，屬看好信號，多頭動能增強');
    result = result.replace(/趨勢: /g, '趨勢係');
    result = result.replace(/波動率: /g, '波動率係');
    result = result.replace(/平均成交量: /g, '平均成交量係');
    result = result.replace(/目標價: /g, '目標價係');
    result = result.replace(/止蝕位: /g, '止蝕位係');
    result = result.replace(/風險回報比: /g, '風險回報比例係');
    result = result.replace(/建議：/g, '建議係');
    result = result.replace(/風險評級: /g, '風險評級係');
    
    // Fix RSI reading
    result = result.replace(/RSI\(14\): (\d+\.?\d*) - (.*)/g, 'RSI14為$1，屬$2');
    
    // Fix percentage reading
    result = result.replace(/(\d+\.?\d*)%/, '$1個巴仙');
    
    // Remove "📋 詳細分析：" prefix
    result = result.replace(/📋 詳細分析：/g, '');
    result = result.replace(/AI新聞分析:/g, '');
    result = result.replace(/AI內容分析:/g, '');
    
  } else if (langKey === '简体中文') {
    // Similar processing for Simplified Chinese
    result = result.replace(/信心评分: (\d+)% 五颗星 \(非常高\)/g, '我对这只股票信心非常高，$1百分之，五颗星');
    result = result.replace(/信心评分: (\d+)% 四颗星 \(高\)/g, '我对这只股票信心高，$1百分之，四颗星');
    result = result.replace(/信心评分: (\d+)% 三颗星 \(中等\)/g, '我对这只股票信心中等，$1百分之，三颗星');
    result = result.replace(/信心评分: (\d+)% 两颗星 \(低\)/g, '我对这只股票信心低，$1百分之，两颗星');
    result = result.replace(/信心评分: (\d+)% 一颗星 \(极低\)/g, '我对这只股票信心极低，$1百分之，一颗星');
    
    result = result.replace(/摘要/g, '第一，摘要');
    result = result.replace(/技术分析/g, '第二，技术分析');
    result = result.replace(/基本面分析/g, '第三，基本面分析');
    result = result.replace(/新闻与风险分析/g, '第四，新闻与风险分析');
    result = result.replace(/具体看好因素/g, '第五，看好因素');
    result = result.replace(/具体看淡因素/g, '第六，看淡因素');
    result = result.replace(/买卖建议/g, '第七，买卖建议');
    result = result.replace(/最终建议及风险评级/g, '第八，最终建议同风险评级');
    
    result = result.replace(/📋 详细分析：/g, '');
    result = result.replace(/AI新闻分析:/g, '');
    
  } else {
    // English
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐⭐ \(Very High\)/g, "I rate this stock 5 stars with $1 percent confidence!");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐⭐ \(High\)/g, "I rate this stock 4 stars with $1 percent confidence!");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐⭐ \(Medium\)/g, "I rate this stock 3 stars with $1 percent confidence.");
    result = result.replace(/Confidence Score: (\d+)% ⭐⭐ \(Low\)/g, "I rate this stock 2 stars with $1 percent confidence. Be careful.");
    result = result.replace(/Confidence Score: (\d+)% ⭐ \(Very Low\)/g, "I rate this stock only 1 star with $1 percent confidence. High risk!");
    
    result = result.replace(/📋 Detailed Analysis: /g, '');
    result = result.replace(/AI News Analysis:/g, '');
    result = result.replace(/AI Content Analysis:/g, '');
  }
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');
  result = result.trim();
  
  return result;
}

export async function speakText(text: string, langKey: string, onEnd?: () => void) {
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
  }
  
  utterance.rate = 0.85;
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