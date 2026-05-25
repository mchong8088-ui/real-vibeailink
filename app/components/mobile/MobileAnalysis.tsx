// Update the TTS useEffect in MobileAnalysis.tsx (only showing the changed part)
// Find the Text-to-Speech useEffect and replace with this:

// Text-to-Speech with Cantonese support
useEffect(() => {
  if (analysisData?.summary && isSpeakerActive && !isPaused) {
    if (utteranceRef.current) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(analysisData.summary);
    
    // Set language for TTS
    if (langKey === 'Cantonese') {
      utterance.lang = 'zh-HK';
      // Try to get Cantonese voice
      const voices = window.speechSynthesis.getVoices();
      const cantoneseVoice = voices.find(voice => voice.lang === 'zh-HK' || voice.lang === 'zh-Hant-HK');
      if (cantoneseVoice) utterance.voice = cantoneseVoice;
    } else if (langKey === '简体中文') {
      utterance.lang = 'zh-CN';
      const chineseVoice = window.speechSynthesis.getVoices().find(voice => voice.lang === 'zh-CN');
      if (chineseVoice) utterance.voice = chineseVoice;
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 0.9;
    utterance.onend = () => { utteranceRef.current = null; };
    utterance.onerror = () => { utteranceRef.current = null; };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }
  return () => { if (utteranceRef.current) window.speechSynthesis.cancel(); };
}, [analysisData?.summary, isSpeakerActive, isPaused, langKey]);
