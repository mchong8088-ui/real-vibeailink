// Unified TTS System - Auto-detects browser, OS, and selects best voice
// No user configuration needed - everything is automatic

type Platform = 'ios-safari' | 'ios-chrome' | 'macos-safari' | 'macos-chrome' | 'android' | 'windows' | 'linux' | 'unknown';

class UnifiedTTS {
  private static instance: UnifiedTTS;
  private voices: SpeechSynthesisVoice[] = [];
  private platform: Platform = 'unknown';
  private isReady = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceChangeListeners: (() => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.detectPlatform();
      this.initVoices();
    }
  }

  static getInstance(): UnifiedTTS {
    if (!UnifiedTTS.instance) {
      UnifiedTTS.instance = new UnifiedTTS();
    }
    return UnifiedTTS.instance;
  }

  onVoicesReady(callback: () => void): void {
    if (this.isReady) {
      callback();
    } else {
      this.voiceChangeListeners.push(callback);
    }
  }

  private detectPlatform(): void {
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

    console.log(`[TTS] Platform: ${this.platform}`);
  }

  private initVoices(): void {
    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0 && !this.isReady) {
        this.isReady = true;
        console.log(`[TTS] Loaded ${this.voices.length} voices`);
        this.voiceChangeListeners.forEach(cb => cb());
        this.voiceChangeListeners = [];
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

    const isCantonese = langKey === 'Cantonese';
    const isMandarin = langKey === '简体中文';

    // Platform-specific voice selection
    const selectors: ((v: SpeechSynthesisVoice) => boolean)[] = [];

    if (this.platform === 'ios-safari') {
      if (isCantonese) {
        selectors.push(
          (v) => v.name === 'Sin-ji',
          (v) => v.name.includes('Sin-ji'),
          (v) => v.lang === 'zh-HK',
          (v) => v.lang.startsWith('zh')
        );
      } else if (isMandarin) {
        selectors.push(
          (v) => v.name === 'Ting-Ting',
          (v) => v.name.includes('Ting-Ting'),
          (v) => v.lang === 'zh-CN',
          (v) => v.lang.startsWith('zh')
        );
      } else {
        selectors.push(
          (v) => v.name === 'Samantha',
          (v) => v.name === 'Alex',
          (v) => v.lang === 'en-US',
          (v) => v.lang.startsWith('en')
        );
      }
    } else if (this.platform === 'android') {
      if (isCantonese) {
        selectors.push(
          (v) => v.lang === 'zh-HK',
          (v) => v.name.includes('Cantonese'),
          (v) => v.lang.startsWith('zh')
        );
      } else if (isMandarin) {
        selectors.push(
          (v) => v.lang === 'zh-CN',
          (v) => v.name.includes('Mandarin'),
          (v) => v.lang.startsWith('zh')
        );
      } else {
        selectors.push(
          (v) => v.lang === 'en-US',
          (v) => v.lang.startsWith('en')
        );
      }
    } else if (this.platform === 'windows') {
      if (isCantonese) {
        selectors.push(
          (v) => v.lang === 'zh-HK',
          (v) => v.name.includes('Hong'),
          (v) => v.lang.startsWith('zh')
        );
      } else if (isMandarin) {
        selectors.push(
          (v) => v.lang === 'zh-CN',
          (v) => v.name.includes('Hui'),
          (v) => v.lang.startsWith('zh')
        );
      } else {
        selectors.push(
          (v) => v.lang === 'en-US',
          (v) => v.lang.startsWith('en')
        );
      }
    } else {
      // Default selection
      if (isCantonese || isMandarin) {
        selectors.push(
          (v) => v.lang === 'zh-HK',
          (v) => v.lang === 'zh-CN',
          (v) => v.lang.startsWith('zh')
        );
      } else {
        selectors.push(
          (v) => v.lang === 'en-US',
          (v) => v.lang.startsWith('en')
        );
      }
    }

    // Try each selector in order
    for (const selector of selectors) {
      const voice = this.voices.find(selector);
      if (voice) {
        console.log(`[TTS] Selected: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    return null;
  }

  speak(text: string, langKey: string, onEnd?: () => void): void {
    if (!text || typeof window === 'undefined') return;

    // Cancel current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language tag
    if (langKey === 'Cantonese') {
      utterance.lang = 'zh-HK';
    } else if (langKey === '简体中文') {
      utterance.lang = 'zh-CN';
    } else {
      utterance.lang = 'en-US';
    }

    // Find and set best voice if available
    const bestVoice = this.findBestVoice(langKey);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (e) => {
      console.error('[TTS] Error:', e);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isReady(): boolean {
    return this.isReady;
  }
}

// Singleton export
export const tts = UnifiedTTS.getInstance();
export const speak = (text: string, langKey: string, onEnd?: () => void) => tts.speak(text, langKey, onEnd);
export const stopSpeaking = () => tts.stop();
export const isVoiceReady = () => tts.isReady();
export const onVoicesReady = (callback: () => void) => tts.onVoicesReady(callback);
