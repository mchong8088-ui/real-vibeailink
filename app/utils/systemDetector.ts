/**
 * Auto-detects the user's hardware, OS, and preferred voice engine.
 * Includes fallbacks for Cantonese (Ekho, Google, or Apple).
 */
export const getSystemProfile = () => {
  // 1. Server-side safety check (Next.js requirement)
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      os: 'Server',
      voiceEngine: 'Default',
      browser: 'Unknown'
    };
  }

  const ua = navigator.userAgent;
  
  // 2. OS and Device Detection
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMac = /Macintosh/.test(ua);
  const isWindows = /Windows/.test(ua);
  const isLinux = /Linux/.test(ua);
  
  // 3. Browser Detection (for Mic/Speech Recognition prefixes)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);

  // 4. Mobile Logic (Screen width + OS check)
  const isMobile = isIOS || isAndroid || window.innerWidth < 768;

  /**
   * 5. Voice Selection & Fallback Logic
   * Cantonese: 
   * - Apple (iOS/Mac): AV Speech Synthesizer (com.apple.ttsbundle.Sin-Ji-premium)
   * - Android: Google Cantonese (zh-HK-x-yom-local)
   * - Others: Ekho Speak (Custom/Linux) or Google Voice
   */
  let voiceEngine = "Google Voice";
  let osName = "Standard";

  if (isIOS || isMac) {
    voiceEngine = "AV Speech Synthesizer";
    osName = isIOS ? "iOS" : "macOS";
  } else if (isAndroid) {
    voiceEngine = "Google Cantonese";
    osName = "Android";
  } else if (isWindows) {
    voiceEngine = "Ekho Speak";
    osName = "Windows";
  } else if (isLinux) {
    voiceEngine = "Ekho Speak";
    osName = "Linux";
  }

  return { 
    isMobile, 
    os: osName, 
    voiceEngine,
    isSafari,
    isChrome,
    userAgent: ua 
  };
};

/**
 * Helper to determine if the browser requires webkit prefixes for Speech
 */
export const getSpeechPrefix = () => {
  if (typeof window === "undefined") return "";
  return (window as any).webkitSpeechRecognition ? "webkit" : "";
};