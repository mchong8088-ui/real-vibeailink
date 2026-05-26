// Unified TTS System - Auto-detects browser, OS, and selects best voice
// No user configuration needed - everything is automatic

type Platform = 'ios-safari' | 'ios-chrome' | 'macos-safari' | 'macos-chrome' | 'android' | 'windows' | 'linux' | 'unknown';
type VoiceType = 'cantonese' | 'mandarin' | 'english';

class UnifiedTTS {
  private static instance: UnifiedTTS;
  private voices: SpeechSynthesisVoice[] = [];
  private platform: Platform = 'unknown';
  private isReady = false;
  private pendingSpeak: { text: string; langKey: string; onEnd?: () => void } | null = null;

  private constructor() {
    this.detectPlatform();
    this.initVoices();
  }

  static getInstance(): UnifiedTTS {
    if (!UnifiedTTS.instance) {
      UnifiedTTS.instance = new UnifiedTTS();
    }
    return UnifiedTTS.instance;
  }

  private detectPlatform(): void {
    if (typeof window === 'undefined') return;
    
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isMac = /Macintosh/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isWindows = /Windows/.test(ua);
    const isLinux = /Linux/.test(ua) && !isAndroid;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);

    if (isIOS) {
      this.platform = isSafari ? 'ios-safari' : 'ios-chrome';
    } else if (isMac) {
      this.platform = isSafari ? 'macos-safari' : 'macos-chrome';
    } else if (isAndroid) {
      this.platform = 'android';
    } else if (isWindows) {
      this.platform = 'windows';
    } else if (isLinux) {
      this.platform = 'linux';
    } else {
      this.platform = 'unknown';
    }

    console.log(`[UnifiedTTS] Platform detected: ${this.platform}`);
  }

  private initVoices(): void {
    if (typeof window === 'undefined') return;

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.isReady = true;
        console.log(`[UnifiedTTS] Loaded ${this.voices.length} voices`);
        // Process any pending speak requests
        if (this.pendingSpeak) {
          this.speak(this.pendingSpeak.text, this.pendingSpeak.langKey, this.pendingSpeak.onEnd);
          this.pendingSpeak = null;
        }
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private findBestVoice(langKey: string): SpeechSynthesisVoice | null {
    if (!this.isReady || this.voices.length === 0) return null;

    // Voice selection strategies based on platform
    const strategies = this.getVoiceStrategies(langKey);
    
    for (const strategy of strategies) {
      const voice = this.voices.find(v => strategy(v));
      if (voice) {
        console.log(`[UnifiedTTS] Selected voice: ${voice.name} (${voice.lang}) for ${langKey} on ${this.platform}`);
        return voice;
      }
    }
    
    console.log(`[UnifiedTTS] No matching voice found for ${langKey}, using default`);
    return null;
  }

  private getVoiceStrategies(langKey: string): Array<(v: SpeechSynthesisVoice) => boolean> {
    const isCantonese = langKey === 'Cantonese';
    const isMandarin = langKey === '简体中文';
    const isEnglish = langKey === 'English';

    // Platform-specific voice names
    const platformVoices = {
      'ios-safari': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.name === 'Sin-ji' || v.name.includes('Sin-ji') || v.lang === 'zh-HK',
        mandarin: (v: SpeechSynthesisVoice) => 
          v.name === 'Ting-Ting' || v.name.includes('Ting-Ting') || v.lang === 'zh-CN',
        english: (v: SpeechSynthesisVoice) => 
          v.name === 'Samantha' || v.name === 'Alex' || v.lang === 'en-US'
      },
      'ios-chrome': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-HK' || v.name.includes('Cantonese'),
        mandarin: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-CN' || v.name.includes('Mandarin'),
        english: (v: SpeechSynthesisVoice) => 
          v.lang === 'en-US'
      },
      'macos-safari': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.name === 'Sin-ji' || v.lang === 'zh-HK',
        mandarin: (v: SpeechSynthesisVoice) => 
          v.name === 'Ting-Ting' || v.lang === 'zh-CN',
        english: (v: SpeechSynthesisVoice) => 
          v.name === 'Samantha' || v.lang === 'en-US'
      },
      'macos-chrome': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-HK' || v.name.includes('Google') && v.name.includes('Cantonese'),
        mandarin: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-CN' || v.name.includes('Google') && v.name.includes('Mandarin'),
        english: (v: SpeechSynthesisVoice) => 
          v.lang === 'en-US'
      },
      'android': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-HK' || v.name.includes('Cantonese'),
        mandarin: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-CN' || v.name.includes('Mandarin'),
        english: (v: SpeechSynthesisVoice) => 
          v.lang === 'en-US'
      },
      'windows': {
        cantonese: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-HK' || v.name.includes('Microsoft') && v.name.includes('Hong'),
        mandarin: (v: SpeechSynthesisVoice) => 
          v.lang === 'zh-CN' || v.name.includes('Microsoft') && v.name.includes('Hui'),
        english: (v: SpeechSynthesisVoice) => 
          v.lang === 'en-US' || v.name.includes('Microsoft')
      }
    };

    const platformKey = this.platform as keyof typeof platformVoices;
    const platformStrategy = platformVoices[platformKey] || platformVoices['windows'];

    if (isCantonese) {
      return [platformStrategy.cantonese, (v) => v.lang.startsWith('zh'), (v) => true];
    }
    if (isMandarin) {
      return [platformStrategy.mandarin, (v) => v.lang.startsWith('zh'), (v) => true];
    }
    if (isEnglish) {
      return [platformStrategy.english, (v) => v.lang.startsWith('en'), (v) => true];
    }
    
    return [(v) => true];
  }

  speak(text: string, langKey: string, onEnd?: () => void): void {
    if (!text || typeof window === 'undefined') return;

    // If voices aren't ready, queue the request
    if (!this.isReady) {
      this.pendingSpeak = { text, langKey, onEnd };
      return;
    }

    // Cancel current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language tag
    if (langKey === 'Cantonese') utterance.lang = 'zh-HK';
    else if (langKey === '简体中文') utterance.lang = 'zh-CN';
    else utterance.lang = 'en-US';

    // Find best voice
    const bestVoice = this.findBestVoice(langKey);
    if (bestVoice) utterance.voice = bestVoice;

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => console.error('[UnifiedTTS] Error:', e);

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
  }

  isVoiceReady(): boolean {
    return this.isReady;
  }
}

// Singleton export
export const tts = UnifiedTTS.getInstance();
export const speak = (text: string, langKey: string, onEnd?: () => void) => tts.speak(text, langKey, onEnd);
export const stopSpeaking = () => tts.stop();
export const isVoiceReady = () => tts.isVoiceReady();
