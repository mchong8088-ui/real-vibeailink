import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Check if running on Vercel
const isVercel = process.env.VERCEL === 'true';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Check if voice is an auto voice
function isAutoVoice(voice: string): boolean {
  return voice === 'Auto-Male' || voice === 'Auto-Female';
}

export async function POST(req: Request) {
  try {
    const { userId, script, langCode, language, selectedVoice, speed, format = 'wav' } = await req.json();

    console.log('========== FULL GENERATION REQUEST ==========');
    console.log('User ID:', userId);
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Format requested:', format);
    console.log('Selected voice:', selectedVoice);
    console.log('Environment:', isVercel ? 'Vercel (cloud TTS)' : 'Local (macOS)');

    // NEW: If Auto-Male or Auto-Female is selected, use cloud TTS
    if (isAutoVoice(selectedVoice)) {
      console.log('Auto voice selected, using cloud TTS (OpenAI) for full generation...');
      
      try {
        const cleanScript = cleanTextForTTS(script || '你好');
        const audioBuffer = await generateCloudTTS(cleanScript, language);
        const audioFormat = 'wav';
        const audioBase64 = audioBuffer.toString('base64');

        const isChinese = /[\u4e00-\u9fff]/.test(cleanScript);
        const estimatedDuration = isChinese 
          ? Math.max(1.5, cleanScript.length / 4)
          : Math.max(1.5, cleanScript.split(/\s+/).length / 3);

        const creditsToDeduct = 2;
        await supabaseAdmin
          .from('profiles')
          .update({ credits: (profile.credits || 0) - creditsToDeduct })
          .eq('id', userId);

        console.log('========== FULL GENERATION COMPLETE (CLOUD) ==========');
        console.log('Audio size:', audioBuffer.length);
        console.log('Format:', audioFormat);

        return NextResponse.json({
          success: true,
          audio: audioBase64,
          format: audioFormat,
          voiceUsed: selectedVoice,
          duration: estimatedDuration,
          durationFormatted: formatDuration(estimatedDuration),
          creditsUsed: creditsToDeduct,
          remainingCredits: (profile.credits || 0) - creditsToDeduct,
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

    // ... rest of your existing code (profile fetching, local TTS, etc.)
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

// Convert WAV to MP3 using ffmpeg
async function convertWavToMp3(wavBuffer: Buffer): Promise<Buffer> {
  const tempWav = path.join(os.tmpdir(), `temp_${Date.now()}.wav`);
  const tempMp3 = path.join(os.tmpdir(), `temp_${Date.now()}.mp3`);
  
  try {
    await fs.promises.writeFile(tempWav, wavBuffer);
    const command = `ffmpeg -i "${tempWav}" -acodec mp3 -ab 192k -ar 22050 "${tempMp3}" -y 2>/dev/null`;
    console.log('MP3 conversion command:', command);
    await execAsync(command);
    const mp3Buffer = await fs.promises.readFile(tempMp3);
    console.log('MP3 size:', mp3Buffer.length, 'bytes');
    return mp3Buffer;
  } finally {
    await fs.promises.unlink(tempWav).catch(() => {});
    await fs.promises.unlink(tempMp3).catch(() => {});
  }
}

// Get audio duration from WAV buffer
async function getAudioDuration(wavBuffer: Buffer): Promise<number> {
  try {
    const tempWav = path.join(os.tmpdir(), `duration_${Date.now()}.wav`);
    await fs.promises.writeFile(tempWav, wavBuffer);
    
    const { stdout } = await execAsync(`afinfo "${tempWav}"`);
    await fs.promises.unlink(tempWav).catch(() => {});
    
    const match = stdout.match(/estimated duration: ([\d.]+) sec/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 0;
  }
}

// Get duration using ffprobe (more accurate)
async function getAudioDurationFfprobe(wavBuffer: Buffer): Promise<number> {
  try {
    const tempWav = path.join(os.tmpdir(), `duration_${Date.now()}.wav`);
    await fs.promises.writeFile(tempWav, wavBuffer);
    
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempWav}"`);
    await fs.promises.unlink(tempWav).catch(() => {});
    
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (error) {
    console.error('Error getting duration with ffprobe:', error);
    return 0;
  }
}

// Format duration as MM:SS
function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate TTS using OpenAI Cloud
async function generateCloudTTS(text: string, language: string): Promise<Buffer> {
  const voiceMap: Record<string, string> = {
    'Cantonese': 'nova',
    'Mandarin': 'nova',
    'English': 'nova',
  };
  
  const cleanText = cleanTextForTTS(text);
  console.log('Cloud TTS text length:', cleanText.length);
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voiceMap[language] || 'nova',
        input: cleanText,
        speed: 1.0,
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

export async function POST(req: Request) {
  try {
    const { userId, script, langCode, language, selectedVoice, speed, format = 'wav' } = await req.json();

    console.log('========== FULL GENERATION REQUEST ==========');
    console.log('User ID:', userId);
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Format requested:', format);
    console.log('Environment:', isVercel ? 'Vercel (cloud TTS)' : 'Local (macOS)');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          credits: 100,
          subscription_plan: 'Free Explorer'
        })
        .select()
        .single();
      profile = newProfile;
    }

    const cleanScript = cleanTextForTTS(script || '你好');
    console.log('Cleaned text length:', cleanScript.length);

    const isCantonese = langCode === 'zh-HK' || language === 'Cantonese';
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

    // --- IF ON VERCEL: USE CLOUD TTS ---
    if (isVercel) {
      console.log('Using cloud TTS (OpenAI) for full generation...');
      
      try {
        const audioBuffer = await generateCloudTTS(cleanScript, language);
        const audioFormat = 'wav';
        const audioBase64 = audioBuffer.toString('base64');

        // Estimate duration (OpenAI TTS doesn't return duration, so estimate)
        const isChinese = /[\u4e00-\u9fff]/.test(cleanScript);
        const estimatedDuration = isChinese 
          ? Math.max(1.5, cleanScript.length / 4)
          : Math.max(1.5, cleanScript.split(/\s+/).length / 3);

        const creditsToDeduct = 2;
        await supabaseAdmin
          .from('profiles')
          .update({ credits: (profile.credits || 0) - creditsToDeduct })
          .eq('id', userId);

        console.log('========== FULL GENERATION COMPLETE (CLOUD) ==========');
        console.log('Audio size:', audioBuffer.length);
        console.log('Format:', audioFormat);

        return NextResponse.json({
          success: true,
          audio: audioBase64,
          format: audioFormat,
          voiceUsed: 'openai-cloud',
          duration: estimatedDuration,
          durationFormatted: formatDuration(estimatedDuration),
          creditsUsed: creditsToDeduct,
          remainingCredits: (profile.credits || 0) - creditsToDeduct,
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

    const tempTxt = path.join(os.tmpdir(), `full_${Date.now()}.txt`);
    const tempAiff = path.join(os.tmpdir(), `full_${Date.now()}.aiff`);
    const tempWav = path.join(os.tmpdir(), `full_${Date.now()}.wav`);

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

      // Try afconvert first
      let wavBuffer: Buffer | null = null;
      try {
        const command = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
        await execAsync(command);
        wavBuffer = await fs.promises.readFile(tempWav);
        console.log('afconvert WAV size:', wavBuffer.length);
        if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
          wavBuffer = null;
        }
      } catch (afconvertError) {
        console.error('afconvert error:', afconvertError);
      }

      if (!wavBuffer || wavBuffer.length < 44) {
        console.log('Falling back to manual conversion...');
        wavBuffer = simpleAiffToWav(aiffBuffer);
      }

      if (!wavBuffer || wavBuffer.length < 44 || wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
        throw new Error('Failed to convert AIFF to WAV');
      }

      // Get audio duration
      let audioDuration = 0;
      try {
        audioDuration = await getAudioDurationFfprobe(wavBuffer);
        if (audioDuration === 0) {
          audioDuration = await getAudioDuration(wavBuffer);
        }
        console.log('Audio duration:', audioDuration, 'seconds');
      } catch (e) {
        console.warn('Could not get audio duration:', e);
        const isChinese = /[\u4e00-\u9fff]/.test(cleanScript);
        audioDuration = isChinese 
          ? Math.max(1.5, cleanScript.length / 4)
          : Math.max(1.5, cleanScript.split(/\s+/).length / 3);
        console.log('Estimated duration (fallback):', audioDuration, 'seconds');
      }

      // Convert to MP3 if requested
      let audioBuffer = wavBuffer;
      let audioFormat = 'wav';

      if (format === 'mp3') {
        try {
          audioBuffer = await convertWavToMp3(wavBuffer);
          audioFormat = 'mp3';
          console.log('MP3 conversion successful');
        } catch (mp3Error) {
          console.error('MP3 conversion failed, falling back to WAV:', mp3Error);
          audioBuffer = wavBuffer;
          audioFormat = 'wav';
        }
      }

      console.log('Final audio size:', audioBuffer.length);
      console.log('Final format:', audioFormat);
      console.log('========== FULL GENERATION COMPLETE (LOCAL) ==========');

      const creditsToDeduct = 2;
      await supabaseAdmin
        .from('profiles')
        .update({ credits: (profile.credits || 0) - creditsToDeduct })
        .eq('id', userId);

      const audioBase64 = audioBuffer.toString('base64');

      return NextResponse.json({
        success: true,
        audio: audioBase64,
        format: audioFormat,
        voiceUsed: voiceToUse,
        duration: audioDuration,
        durationFormatted: formatDuration(audioDuration),
        creditsUsed: creditsToDeduct,
        remainingCredits: (profile.credits || 0) - creditsToDeduct,
      });

    } finally {
      await fs.promises.unlink(tempTxt).catch(() => {});
      await fs.promises.unlink(tempAiff).catch(() => {});
      await fs.promises.unlink(tempWav).catch(() => {});
    }

  } catch (error: any) {
    console.error('Full Voice TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
    }, { status: 500 });
  }
}