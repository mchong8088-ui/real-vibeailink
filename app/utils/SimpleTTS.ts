// app/utils/SimpleTTS.ts
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Get intro message based on voice language
function getIntroMessage(voiceLanguage: string): string {
  if (voiceLanguage === 'Cantonese') {
    return "你好，我哋係米高和杜麗莎，你嘅財務和市場分析員，好高興為你報告。";
  } else if (voiceLanguage === 'Mandarin') {
    return "你好，我们是米高和杜丽莎，你的财务和市场分析师，很高兴为你报告。";
  } else if (voiceLanguage === 'Taiwanese') {
    return "你好，我們是米高和杜麗莎，你的財務和市場分析員，很高興為你報告。";
  } else {
    return "Hello, this is Michael and Teresa, your Finance and Market Analysts, here to give you the report.";
  }
}

// Helper to wait for voices on iOS
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
      // Timeout fallback after 1 second
      setTimeout(() => {
        const timeoutVoices = window.speechSynthesis.getVoices();
        if (timeoutVoices.length > 0) {
          resolve(timeoutVoices);
        } else {
          resolve([]);
        }
      }, 1000);
    }
  });
};

// Get best voice with iOS-specific name matching
async function getBestVoice(voiceLanguage: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await waitForVoices();
  
  console.log("🎤 Available voices:", voices.map(v => `${v.name} (${v.lang})`).join(', '));
  
  if (voices.length === 0) return null;
  
  // iOS voice name mapping
  if (voiceLanguage === 'Mandarin') {
    // iOS Mandarin voices: Ting-Ting (zh-CN), Mei-Jia (zh-TW), Li-Li (zh-TW)
    const mandarinVoice = voices.find(v => 
      v.name === 'Ting-Ting' ||
      v.name === 'Mei-Jia' ||
      v.name === 'Li-Li' ||
      v.name.includes('Ting') ||
      v.lang === 'zh-CN' ||
      v.lang === 'zh-TW'
    );
    if (mandarinVoice) {
      console.log("🎤 Found Mandarin voice:", mandarinVoice.name);
      return mandarinVoice;
    }
  } 
  else if (voiceLanguage === 'Taiwanese') {
    const taiwaneseVoice = voices.find(v => 
      v.name === 'Mei-Jia' ||
      v.name === 'Li-Li' ||
      v.lang === 'zh-TW'
    );
    if (taiwaneseVoice) {
      console.log("🎤 Found Taiwanese voice:", taiwaneseVoice.name);
      return taiwaneseVoice;
    }
    // Fallback to Mandarin
    const mandarinVoice = voices.find(v => 
      v.name === 'Ting-Ting' || 
      v.lang === 'zh-CN'
    );
    if (mandarinVoice) {
      console.log("🎤 Fallback to Mandarin voice for Taiwanese:", mandarinVoice.name);
      return mandarinVoice;
    }
  }
  else if (voiceLanguage === 'Cantonese') {
    const cantoneseVoice = voices.find(v => 
      v.name === 'Sin-ji' ||
      v.name.includes('Sin-ji') ||
      v.lang === 'zh-HK'
    );
    if (cantoneseVoice) {
      console.log("🎤 Found Cantonese voice:", cantoneseVoice.name);
      return cantoneseVoice;
    }
    // Fallback to any Chinese voice
    const anyChinese = voices.find(v => 
      v.lang.startsWith('zh-') || v.lang.startsWith('yue-')
    );
    if (anyChinese) {
      console.log("🎤 Fallback to Chinese voice for Cantonese:", anyChinese.name);
      return anyChinese;
    }
  }
  else {
    // English
    const englishVoice = voices.find(v => 
      v.lang === 'en-US' && (v.name === 'Samantha' || v.name === 'Alex' || v.name === 'Google US English')
    );
    if (englishVoice) return englishVoice;
    const anyEnglish = voices.find(v => v.lang.startsWith('en-'));
    if (anyEnglish) return anyEnglish;
  }
  
  // Ultimate fallback: return any voice
  if (voices.length > 0) {
    console.log("🎤 Ultimate fallback to first available voice:", voices[0].name);
    return voices[0];
  }
  
  return null;
}

// Prepare text for TTS
function prepareTextForTTS(text: string, textLanguage: string): string {
  let result = text;
  
  // Remove emojis
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
  
  // Remove markdown
  result = result.replace(/\*\*/g, '');
  result = result.replace(/###/g, '');
  result = result.replace(/##/g, '');
  result = result.replace(/\*/g, '');
  result = result.replace(/•/g, '');
  
  // Replace line breaks with spaces
  result = result.replace(/\n/g, ' ');
  
  // Replace colons with natural pauses
  result = result.replace(/:/g, ' ');
  result = result.replace(/：/g, ' ');
  
  if (textLanguage === 'Traditional Chinese') {
    result = result.replace(/(\d+\.?\d*)\s+-\s+([\u4e00-\u9fa5])/g, '$1 $2');
    result = result.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/g, '$1至$2');
    result = result.replace(/\s*-\s*/g, ' ');
    
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
    result = result.replace(/\. /g, ' ');
    result = result.replace(/\.$/g, '');
    
  } else if (textLanguage === 'Simplified Chinese') {
    result = result.replace(/(\d+\.?\d*)\s+-\s+([\u4e00-\u9fa5])/g, '$1 $2');
    result = result.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/g, '$1至$2');
    result = result.replace(/\s*-\s*/g, ' ');
    
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
    result = result.replace(/\. /g, ' ');
    result = result.replace(/\.$/g, '');
    
  } else {
    // English
    result = result.replace(/(\d+\.?\d*)\s+-\s+([A-Za-z])/g, '$1 $2');
    result = result.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/g, '$1 to $2');
    result = result.replace(/\s*-\s*/g, ' ');
    
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
    result = result.replace(/\. /g, ' ');
    result = result.replace(/\.$/g, '');
  }
  
  // Clean up multiple spaces
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
  
  // IMPORTANT: Add intro message before the report
  const intro = getIntroMessage(voiceLanguage);
  const cleanedReport = prepareTextForTTS(text, textLanguage);
  const fullText = `${intro} ${cleanedReport}`;
  
  console.log(`📢 Speaking with ${voiceLanguage} voice`);
  console.log(`📝 Full text length: ${fullText.length} chars`);
  
  const utterance = new SpeechSynthesisUtterance(fullText);
  
  // Set language tag
  if (voiceLanguage === 'Cantonese') {
    utterance.lang = 'zh-HK';
  } else if (voiceLanguage === 'Mandarin') {
    utterance.lang = 'zh-CN';
  } else if (voiceLanguage === 'Taiwanese') {
    utterance.lang = 'zh-TW';
  } else {
    utterance.lang = 'en-US';
  }
  
  // CRITICAL: Wait for voices and get the exact voice
  const bestVoice = await getBestVoice(voiceLanguage);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`🎤 Using voice: ${bestVoice.name} (${bestVoice.lang}) for voice language: ${voiceLanguage}`);
  } else {
    console.log(`🎤 No specific voice found for ${voiceLanguage}, using default with lang=${utterance.lang}`);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) && voiceLanguage !== 'English') {
      console.log('📱 iOS: Please download voice in Settings > Accessibility > Spoken Content > Voices');
    }
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