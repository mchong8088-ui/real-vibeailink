import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Check if voice exists
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

// Generate audio using say command and convert with afconvert
async function generateAndConvertAudio(text: string, voice: string, rate: number): Promise<Buffer> {
  const tempTxt = path.join(os.tmpdir(), `full_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `full_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `full_${Date.now()}.wav`);
  
  try {
    // Step 1: Generate AIFF using say
    await fs.promises.writeFile(tempTxt, text, 'utf-8');
    
    const sayCommand = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Say Command:', sayCommand);
    await execAsync(sayCommand, { shell: '/bin/bash' });
    
    // Step 2: Convert AIFF to WAV using afconvert (macOS built-in)
    const afconvertCommand = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
    console.log('Afconvert Command:', afconvertCommand);
    await execAsync(afconvertCommand, { shell: '/bin/bash' });
    
    // Step 3: Read the WAV file
    const wavBuffer = await fs.promises.readFile(tempWav);
    console.log('WAV size from afconvert:', wavBuffer.length, 'bytes');
    
    // Verify WAV header
    const isWav = wavBuffer.toString('ascii', 0, 4) === 'RIFF';
    console.log('Is valid WAV from afconvert?', isWav);
    
    if (!isWav) {
      console.error('afconvert produced invalid WAV, trying fallback...');
      // Fallback: try to convert with different settings
      const fallbackCommand = `afconvert -f WAVE -d LEI16 "${tempAiff}" "${tempWav}"`;
      console.log('Fallback afconvert:', fallbackCommand);
      await execAsync(fallbackCommand, { shell: '/bin/bash' });
      const fallbackWav = await fs.promises.readFile(tempWav);
      console.log('Fallback WAV size:', fallbackWav.length);
      return fallbackWav;
    }
    
    return wavBuffer;
    
  } finally {
    await fs.promises.unlink(tempTxt).catch(() => {});
    await fs.promises.unlink(tempAiff).catch(() => {});
    await fs.promises.unlink(tempWav).catch(() => {});
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

// Get audio duration using ffprobe
async function getAudioDuration(wavBuffer: Buffer): Promise<number> {
  try {
    const tempWav = path.join(os.tmpdir(), `duration_${Date.now()}.wav`);
    await fs.promises.writeFile(tempWav, wavBuffer);
    
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempWav}"`);
    await fs.promises.unlink(tempWav).catch(() => {});
    
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (error) {
    console.error('Error getting duration:', error);
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

export async function POST(req: Request) {
  try {
    const { userId, script, langCode, language, selectedVoice, speed, format = 'wav' } = await req.json();

    console.log('========== FULL GENERATION REQUEST ==========');
    console.log('User ID:', userId);
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);
    console.log('Format requested:', format);

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

    // ============================================================
    // DETERMINE VOICE TO USE
    // ============================================================
    let voiceToUse = selectedVoice;
    
    if (!voiceToUse || voiceToUse === 'Auto-Male' || voiceToUse === 'Auto-Female') {
      if (isCantonese) {
        const voices = ['Aasing (Enhanced)', 'Aasing', 'Sinji'];
        for (const v of voices) {
          if (await voiceExists(v)) {
            voiceToUse = v;
            console.log('Using Cantonese voice:', v);
            break;
          }
        }
      } else if (isMandarin) {
        const voices = ['Tingting', 'Han (Enhanced)'];
        for (const v of voices) {
          if (await voiceExists(v)) {
            voiceToUse = v;
            console.log('Using Mandarin voice:', v);
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

    // ============================================================
    // GENERATE AUDIO
    // ============================================================
    let speechRate = 160;
    if (isEnglish) speechRate = 185;
    if (speed) speechRate = Math.round(speed * 175);

    try {
      // Generate audio using say and afconvert
      const wavBuffer = await generateAndConvertAudio(cleanScript, voiceToUse, speechRate);
      
      if (!wavBuffer || wavBuffer.length < 44) {
        throw new Error('Audio generation produced invalid file');
      }
      
      // Verify WAV header
      const isWavValid = wavBuffer.toString('ascii', 0, 4) === 'RIFF';
      console.log('Final WAV valid:', isWavValid);
      console.log('Final WAV size:', wavBuffer.length, 'bytes');

      // Get audio duration
      let audioDuration = 0;
      try {
        audioDuration = await getAudioDuration(wavBuffer);
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
      console.log('========== FULL GENERATION COMPLETE ==========');

      // Deduct credits
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

    } catch (error: any) {
      console.error('Generation error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'TTS generation failed',
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Full Voice TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
    }, { status: 500 });
  }
}