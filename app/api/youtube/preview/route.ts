import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Check if running on Vercel
const isVercel = process.env.VERCEL === 'true';

// Clean text for TTS
function cleanTextForTTS(text: string): string {
  if (!text) return '你好';
  
  let cleaned = text
    .replace(/[？?]/g, '')
    .replace(/[！!]/g, '')
    .replace(/[。.]/g, '')
    .replace(/[，,、]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleaned) {
    cleaned = text.replace(/[？?！!。.，,、\s]/g, '').trim();
  }
  
  if (!cleaned) {
    cleaned = '你好';
  }
  
  return cleaned;
}

// Check if voice exists (macOS only)
async function voiceExists(voiceName: string): Promise<boolean> {
  if (!voiceName) return false;
  
  try {
    const { stdout } = await execAsync(`say -v "?"`);
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(voiceName) || line.includes(voiceName)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking voice:', error);
    return false;
  }
}

// Simple AIFF to WAV conversion
function simpleAiffToWav(aiffBuffer: Buffer): Buffer {
  try {
    console.log('Starting AIFF to WAV conversion...');
    
    const ssndIndex = aiffBuffer.indexOf('SSND');
    if (ssndIndex === -1) {
      console.error('SSND chunk not found');
      return Buffer.alloc(0);
    }

    const chunkSize = aiffBuffer.readUInt32BE(ssndIndex + 4);
    const audioStart = ssndIndex + 16;
    const audioSize = chunkSize - 8;
    const audioData = aiffBuffer.slice(audioStart, audioStart + audioSize);
    
    console.log('Audio data size:', audioData.length);

    if (audioData.length === 0) {
      console.error('No audio data extracted');
      return Buffer.alloc(0);
    }

    const sampleRate = 22050;
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const result = Buffer.concat([header, audioData]);
    console.log('WAV size:', result.length);
    return result;

  } catch (error) {
    console.error('Conversion error:', error);
    return Buffer.alloc(0);
  }
}

// Generate TTS using Google Cloud TTS (Supports Cantonese!)
async function generateGoogleCloudTTSCantonese(text: string, speed: number = 1.0, selectedVoice: string = 'Auto-Female'): Promise<Buffer | null> {
  const cleanText = cleanTextForTTS(text);
  console.log('Google Cloud TTS (Cantonese) text length:', cleanText.length);
  
  // Google Cloud TTS Cantonese voices
  // Female: 'zh-HK-Standard-A', 'zh-HK-Wavenet-A'
  // Male: 'zh-HK-Standard-B', 'zh-HK-Wavenet-B'
  const getVoice = (): string => {
    if (selectedVoice === 'Auto-Male') {
      return 'zh-HK-Standard-B'; // Male Cantonese voice
    }
    if (selectedVoice === 'Auto-Female') {
      return 'zh-HK-Standard-A'; // Female Cantonese voice
    }
    return 'zh-HK-Standard-A'; // Default female
  };
  
  const voiceName = getVoice();
  console.log('Using Google Cantonese voice:', voiceName);
  
  try {
    // Using Google Cloud TTS REST API
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('No Google Cloud API key found');
      return null;
    }
    
    // Adjust speaking rate (Google uses different scale: 0.25 to 4.0)
    // Map our speed (0.5-1.5) to Google's scale
    const googleSpeed = Math.min(4.0, Math.max(0.25, speed * 0.9));
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: cleanText,
          },
          voice: {
            languageCode: 'zh-HK',
            name: voiceName,
            ssmlGender: selectedVoice === 'Auto-Male' ? 'MALE' : 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'LINEAR16', // WAV format
            speakingRate: googleSpeed,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud TTS error:', errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      console.error('No audio content in response');
      return null;
    }
    
    // Decode base64 audio content
    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    console.log('Google Cloud TTS generated, size:', audioBuffer.length, 'bytes');
    
    // Google returns WAV format with LINEAR16 encoding, we can use it directly
    return audioBuffer;
    
  } catch (error) {
    console.error('Google Cloud TTS error:', error);
    return null;
  }
}

// Generate TTS using OpenAI Cloud (Mandarin/English only)
async function generateOpenAITTS(text: string, language: string, speed: number = 1.0, selectedVoice: string = 'Auto-Female'): Promise<Buffer | null> {
  const cleanText = cleanTextForTTS(text);
  console.log('OpenAI TTS text length:', cleanText.length);
  
  const getVoice = (): string => {
    if (selectedVoice === 'Auto-Male') {
      return 'onyx'; // Deeper voice
    }
    if (selectedVoice === 'Auto-Female') {
      return 'nova'; // Brighter voice
    }
    return 'nova';
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: getVoice(),
        input: cleanText,
        speed: Math.min(1.5, Math.max(0.5, speed)),
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI TTS error response:', errorData);
      return null;
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    console.log('OpenAI TTS generated, size:', audioBuffer.length, 'bytes');
    return audioBuffer;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return null;
  }
}

// Check if voice is an auto voice
function isAutoVoice(voice: string): boolean {
  return voice === 'Auto-Male' || voice === 'Auto-Female';
}

// Check if language is Cantonese
function isCantonese(langCode: string, language: string): boolean {
  return langCode === 'zh-HK' || language === 'Cantonese';
}

export async function POST(req: Request) {
  try {
    const { script, langCode, language, speed, voiceType, selectedVoice } = await req.json();

    console.log('========== PREVIEW REQUEST ==========');
    console.log('Original script:', script);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);
    console.log('Speed:', speed);
    console.log('Environment:', isVercel ? 'Vercel (cloud)' : 'Local (macOS)');

    const cleanScript = cleanTextForTTS(script || '你好');
    console.log('Cleaned text:', cleanScript);

    const isCantoneseLang = isCantonese(langCode, language);
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

    // --- CANTONESE ON VERCELL OR ANY CLOUD ---
    if (isCantoneseLang) {
      console.log('Cantonese detected - trying Google Cloud TTS...');
      
      // Try Google Cloud TTS first (supports Cantonese!)
      try {
        const googleAudio = await generateGoogleCloudTTSCantonese(cleanScript, speed || 1.0, selectedVoice);
        if (googleAudio) {
          console.log('Google Cloud TTS (Cantonese) successful!');
          const audioData = new Uint8Array(googleAudio);
          return new NextResponse(audioData, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': audioData.length.toString(),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Voice-Used': selectedVoice || 'google-cantonese',
              'X-Language-Used': 'Cantonese (Google Cloud)',
              'X-Provider': 'Google-Cloud-TTS',
            },
          });
        }
      } catch (googleError) {
        console.error('Google Cloud TTS failed:', googleError);
      }
      
      // If Google fails, try local macOS (if available)
      if (!isVercel) {
        console.log('Google Cloud TTS failed, trying local macOS TTS...');
        // Fall through to local macOS TTS
      } else {
        // On Vercel with no Google fallback
        return NextResponse.json({ 
          success: false, 
          error: 'Cantonese voice generation is not available on the web. Please use the desktop app on macOS.',
          fallback: 'For Cantonese, please download and run the app locally on macOS.'
        }, { status: 503 });
      }
    }

    // --- MANDARIN OR ENGLISH ON VERCEL ---
    if (isVercel && (isMandarin || isEnglish)) {
      console.log(`Using OpenAI TTS for ${language} on Vercel...`);
      
      try {
        const audioBuffer = await generateOpenAITTS(cleanScript, language, speed || 1.0, selectedVoice);
        if (audioBuffer) {
          console.log('OpenAI TTS successful!');
          const audioData = new Uint8Array(audioBuffer);
          return new NextResponse(audioData, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': audioData.length.toString(),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Voice-Used': selectedVoice || 'openai',
              'X-Language-Used': language,
              'X-Provider': 'OpenAI-TTS',
            },
          });
        }
      } catch (openAIError) {
        console.error('OpenAI TTS failed:', openAIError);
        return NextResponse.json({ 
          success: false, 
          error: 'Voice generation temporarily unavailable. Please try again later.'
        }, { status: 503 });
      }
    }

    // --- LOCAL macOS TTS (FALLBACK) ---
    console.log('Using local macOS TTS as fallback...');
    
    // Get voice
    let voiceToUse = selectedVoice;
    
    if (isCantoneseLang) {
      const cantoneseVoices = ['Aasing (Enhanced)', 'Aasing', 'Sinji'];
      for (const v of cantoneseVoices) {
        if (await voiceExists(v)) {
          voiceToUse = v;
          console.log('Using Cantonese voice:', v);
          break;
        }
      }
    }
    
    if (!voiceToUse || isAutoVoice(voiceToUse)) {
      if (isCantoneseLang) {
        const voices = ['Aasing (Enhanced)', 'Aasing', 'Sinji'];
        for (const v of voices) {
          if (await voiceExists(v)) {
            voiceToUse = v;
            console.log('Auto-selected Cantonese voice:', v);
            break;
          }
        }
      } else if (isMandarin) {
        const voices = ['Tingting', 'Han (Enhanced)'];
        for (const v of voices) {
          if (await voiceExists(v)) {
            voiceToUse = v;
            console.log('Auto-selected Mandarin voice:', v);
            break;
          }
        }
      } else {
        voiceToUse = 'Samantha';
      }
    }

    if (!voiceToUse) {
      voiceToUse = 'Samantha';
    }

    console.log('Final voice to use:', voiceToUse);

    let speechRate = 160;
    if (isEnglish) speechRate = 185;
    if (speed) speechRate = Math.round(speed * 175);

    const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
    const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);

    try {
      await fs.promises.writeFile(tempTxt, cleanScript, 'utf-8');

      const sayCommand = `say -v "${voiceToUse}" -r ${speechRate} -f "${tempTxt}" -o "${tempAiff}"`;
      console.log('Say Command:', sayCommand);
      await execAsync(sayCommand);

      const aiffBuffer = await fs.promises.readFile(tempAiff);
      console.log('AIFF file size:', aiffBuffer.length, 'bytes');

      if (!aiffBuffer || aiffBuffer.length === 0) {
        throw new Error('Audio generation produced empty file');
      }

      const wavBuffer = simpleAiffToWav(aiffBuffer);

      if (!wavBuffer || wavBuffer.length < 44) {
        throw new Error('Failed to convert AIFF to WAV');
      }

      console.log('WAV buffer size:', wavBuffer.length, 'bytes');
      console.log('========== PREVIEW COMPLETE ==========');

      const wavData = new Uint8Array(wavBuffer);
      
      return new NextResponse(wavData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': wavData.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Voice-Used': voiceToUse,
          'X-Language-Used': language,
        },
      });

    } finally {
      await fs.promises.unlink(tempTxt).catch(() => {});
      await fs.promises.unlink(tempAiff).catch(() => {});
    }

  } catch (error: any) {
    console.error('Preview TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
      details: error.stack 
    }, { status: 500 });
  }
}