export const speakWithLanguage = (
  text: string,
  langKey: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null => {
  if (!text || typeof window === 'undefined') return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  switch (langKey) {
    case 'Cantonese':
      utterance.lang = 'zh-HK';
      break;
    case '简体中文':
      utterance.lang = 'zh-CN';
      break;
    default:
      utterance.lang = 'en-US';
  }

  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
};
