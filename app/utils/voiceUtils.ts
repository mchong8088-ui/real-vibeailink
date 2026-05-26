// Utility to get the correct voice for TTS across different browsers

export const getVoiceForLanguage = (langKey: string): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  
  const voices = window.speechSynthesis.getVoices();
  
  // Map language keys to voice selection criteria
  const voicePreferences = {
    Cantonese: {
      languages: ['zh-HK', 'zh-Hant-HK', 'zh-TW', 'yue-HK', 'zh-Hant'],
      keywords: ['Sin-ji', 'Ting-Ting', 'Mei-Jia', 'HK', 'Hong Kong', 'Cantonese']
    },
    '简体中文': {
      languages: ['zh-CN', 'zh-Hans-CN', 'cmn-CN', 'zh'],
      keywords: ['Ting-Ting', 'Chinese', 'China', 'Mandarin']
    },
    English: {
      languages: ['en-US', 'en-GB', 'en-AU'],
      keywords: ['Samantha', 'Google UK', 'Alex', 'English']
    }
  };
  
  const prefs = voicePreferences[langKey as keyof typeof voicePreferences];
  if (!prefs) return null;
  
  // First try: Exact language match
  let voice = voices.find(v => prefs.languages.includes(v.lang));
  if (voice) return voice;
  
  // Second try: Keyword match in voice name
  voice = voices.find(v => 
    prefs.keywords.some(keyword => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  if (voice) return voice;
  
  // Third try: Language starts with (e.g., zh for Chinese)
  const langPrefix = prefs.languages[0].split('-')[0];
  voice = voices.find(v => v.lang.startsWith(langPrefix));
  if (voice) return voice;
  
  // Fallback: Return any voice with the right language family
  return voices.find(v => v.lang.startsWith('zh')) || null;
};

export const speakWithBrowserSupport = (
  text: string,
  langKey: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null => {
  if (!text || typeof window === 'undefined') return null;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language tag
  let langTag = 'en-US';
  if (langKey === 'Cantonese') langTag = 'zh-HK';
  else if (langKey === '简体中文') langTag = 'zh-CN';
  utterance.lang = langTag;
  
  // Try to get the best voice for the selected language
  const bestVoice = getVoiceForLanguage(langKey);
  if (bestVoice) {
    utterance.voice = bestVoice;
    console.log(`Using voice: ${bestVoice.name} (${bestVoice.lang}) for ${langKey}`);
  } else {
    console.log(`No specific voice found for ${langKey}, using default with lang=${langTag}`);
  }
  
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;
  
  // For Safari, we need to ensure voices are loaded
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const newVoice = getVoiceForLanguage(langKey);
      if (newVoice) utterance.voice = newVoice;
      window.speechSynthesis.speak(utterance);
    };
    return utterance;
  }
  
  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};
