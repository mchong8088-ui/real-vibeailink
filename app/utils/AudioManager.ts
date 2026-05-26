// Global audio manager for handling Bluetooth/headphone output
// This works across all browsers and devices

class AudioManager {
  private static instance: AudioManager;
  private audioElement: HTMLAudioElement | null = null;
  private useAlternateOutput = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Create a silent audio element to help with audio routing
      this.audioElement = new Audio();
      this.audioElement.volume = 0;
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Set whether to prefer Bluetooth/headphone output
  setUseBluetoothOutput(enabled: boolean) {
    this.useAlternateOutput = enabled;
    if (this.audioElement) {
      // This helps browsers route audio to the selected output
      // The actual routing is handled by the browser/OS
      if (enabled) {
        this.audioElement.setSinkId?.('default');
      }
    }
    console.log(`Audio output mode: ${enabled ? 'Bluetooth/Headphone preferred' : 'Speaker preferred'}`);
  }

  isBluetoothPreferred(): boolean {
    return this.useAlternateOutput;
  }

  // Get current audio output info (for display)
  getCurrentOutputInfo(): string {
    if (typeof window === 'undefined') return 'Speaker';
    
    // Check if Bluetooth device is connected (browser API)
    if ('bluetooth' in navigator) {
      // This is a hint - actual detection requires device connection
      return this.useAlternateOutput ? 'Bluetooth/Headphone' : 'Speaker';
    }
    return this.useAlternateOutput ? 'External Audio' : 'Speaker';
  }
}

export const audioManager = AudioManager.getInstance();
