// /lib/edge-tts-wrapper.js
// This is a JavaScript wrapper to avoid TypeScript parsing issues

let edgeTTSModule = null;

async function getEdgeTTS() {
  if (!edgeTTSModule) {
    // Dynamically import the module
    edgeTTSModule = await import('edge-tts');
  }
  return edgeTTSModule;
}

export async function generateSpeech(text, voiceName, options = {}) {
  try {
    const module = await getEdgeTTS();
    
    // Try different export patterns
    let EdgeTTSClass = module.default || module.EdgeTTS || module;
    
    // If it's a function that returns an instance
    let voice;
    if (typeof EdgeTTSClass === 'function') {
      try {
        // Try as constructor
        voice = new EdgeTTSClass(voiceName);
      } catch (e) {
        // Try as factory function
        voice = EdgeTTSClass(voiceName);
      }
    } else {
      // Try to find a create method
      voice = EdgeTTSClass.create ? EdgeTTSClass.create(voiceName) : null;
    }
    
    if (!voice) {
      throw new Error('Could not create voice instance');
    }
    
    const rate = options.speed === 1.0 ? '+0%' : 
                 options.speed > 1.0 ? `+${Math.round((options.speed - 1) * 100)}%` : 
                 `-${Math.round((1 - options.speed) * 100)}%`;
    
    // Try different method names
    let audioBuffer;
    if (typeof voice.tts === 'function') {
      audioBuffer = await voice.tts(text, {
        rate: rate,
        pitch: options.pitch || '+0%',
      });
    } else if (typeof voice.speak === 'function') {
      audioBuffer = await voice.speak(text, {
        rate: rate,
        pitch: options.pitch || '+0%',
      });
    } else if (typeof voice.generate === 'function') {
      audioBuffer = await voice.generate(text, {
        rate: rate,
        pitch: options.pitch || '+0%',
      });
    } else {
      throw new Error('No TTS method found on voice object');
    }
    
    return audioBuffer;
  } catch (error) {
    console.error('Edge TTS error:', error);
    throw error;
  }
}

export function getFallbackVoice(voiceName) {
  if (voiceName && voiceName.includes('WanLung')) {
    return 'zh-HK-HiuMaanNeural';
  } else if (voiceName && voiceName.includes('HiuMaan')) {
    return 'zh-HK-WanLungNeural';
  } else if (voiceName && voiceName.includes('zh-CN')) {
    return 'zh-CN-XiaoxiaoNeural';
  } else if (voiceName && voiceName.includes('zh-TW')) {
    return 'zh-TW-HsiaoYuNeural';
  }
  return 'zh-HK-WanLungNeural';
}