// Update imports - add the TTS utility
import { speakWithLanguage, stopSpeaking } from '../../utils/tts';

// Replace the TTS useEffect and toggleSpeak function with these:

useEffect(() => {
  if (summaryText && isSpeaking) {
    stopSpeaking();
    speakWithLanguage(
      summaryText,
      langKey,
      undefined,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  }
  return () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };
}, [summaryText, isSpeaking, langKey]);

const toggleSpeak = () => {
  if (isSpeaking) {
    stopSpeaking();
    setIsSpeaking(false);
  } else if (summaryText) {
    setIsSpeaking(true);
  }
};
