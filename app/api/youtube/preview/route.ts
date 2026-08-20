import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

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
  const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `preview_${Date.now()}.wav`);
  
  try {
    // Step 1: Generate AIFF using say
    await fs.promises.writeFile(tempTxt, text, 'utf-8');
    
    const sayCommand = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Say Command:', sayCommand);
    await execAsync(sayCommand, { shell: '/bin/bash' });
    
    // Step 2: Convert AIFF to WAV using afconvert (macOS built-in)
    // This is the most reliable way to get browser-compatible WAV
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

export async function POST(req: Request) {
  try {
    const { script, langCode, language, speed, voiceType, selectedVoice } = await req.json();

    console.log('========== PREVIEW REQUEST ==========');
    console.log('Script:', script);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);

    const cleanScript = cleanTextForTTS(script || '你好');
    console.log('Cleaned text:', cleanScript);

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
    // GENERATE AUDIO USING SAY + A F CONVERT
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
      console.log('========== PREVIEW COMPLETE ==========');
      
      // Return audio with proper headers
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
      
    } catch (error: any) {
      console.error('Generation error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'TTS generation failed',
      }, { status: 500 });
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