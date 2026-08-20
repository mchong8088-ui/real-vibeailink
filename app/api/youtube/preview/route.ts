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

// Generate TTS using OpenAI Cloud
async function generateCloudTTS(text: string, language: string, speed: number = 1.0, selectedVoice: string = 'Auto-Female'): Promise<Buffer> {
  // Map language and voice selection to OpenAI voice
  const getVoice = (): string => {
    // OpenAI voice options: alloy, echo, fable, onyx, nova, shimmer
    // onyx = deeper/male-like, nova = brighter/female-like
    if (selectedVoice === 'Auto-Male') {
      return 'onyx'; // Deeper voice
    }
    if (selectedVoice === 'Auto-Female') {
      return 'nova'; // Brighter voice
    }
    // Default fallback
    return 'nova';
  };
  
  const openAIVoice = getVoice();
  const cleanText = cleanTextForTTS(text);
  console.log('Cloud TTS text length:', cleanText.length);
  console.log('Using OpenAI voice:', openAIVoice);
  console.log('Speed:', speed);
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: openAIVoice,
        input: cleanText.slice(0, 200), // Preview only first 200 chars
        speed: Math.min(1.5, Math.max(0.5, speed)), // Clamp between 0.5 and 1.5
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI TTS error response:', errorData);
      throw new Error(`OpenAI TTS failed: ${response.status}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    console.log('Cloud TTS generated, size:', audioBuffer.length, 'bytes');
    return audioBuffer;
  } catch (error) {
    console.error('Cloud TTS error:', error);
    throw error;
  }
}

// Check if voice is an auto voice
function isAutoVoice(voice: string): boolean {
  return voice === 'Auto-Male' || voice === 'Auto-Female';
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

    const isCantonese = langCode === 'zh-HK' || language === 'Cantonese';
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

    // ALWAYS use cloud TTS on Vercel or when Auto voice is selected
    const shouldUseCloud = isVercel || isAutoVoice(selectedVoice);

    if (shouldUseCloud) {
      console.log('Using cloud TTS (OpenAI) for preview...');
      
      try {
        const audioBuffer = await generateCloudTTS(cleanScript, language, speed || 1.0, selectedVoice);
        
        console.log('Cloud TTS generated, size:', audioBuffer.length);
        console.log('========== PREVIEW COMPLETE ==========');
        
        const audioData = new Uint8Array(audioBuffer);
        
        return new NextResponse(audioData, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioData.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Voice-Used': selectedVoice,
            'X-Language-Used': language,
            'X-Conversion-Method': 'cloud-tts',
            'X-Speed': speed?.toString() || '1.0',
          },
        });
      } catch (cloudError: any) {
        console.error('Cloud TTS failed:', cloudError);
        return NextResponse.json({ 
          success: false, 
          error: 'Voice generation temporarily unavailable. Please try again later.',
          fallback: 'You can also use the desktop app for voice features.'
        }, { status: 503 });
      }
    }

    // --- LOCAL macOS TTS (only runs locally, not on Vercel) ---
    // Get voice
    let voiceToUse = selectedVoice;
    
    if (isCantonese) {
      const voices = ['Aasing (Enhanced)', 'Aasing', 'Sinji'];
      for (const v of voices) {
        if (await voiceExists(v)) {
          voiceToUse = v;
          console.log('Using Cantonese voice:', v);
          break;
        }
      }
    } else if (voiceToUse && await voiceExists(voiceToUse)) {
      console.log('Using selected voice:', voiceToUse);
    } else {
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