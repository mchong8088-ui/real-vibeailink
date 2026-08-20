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
  
  // On Vercel, skip this check entirely
  if (isVercel) {
    console.log('On Vercel - skipping voice existence check');
    return false;
  }
  
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

// Generate TTS using OpenAI Cloud (Mandarin/English)
async function generateOpenAITTS(text: string, language: string, speed: number = 1.0, selectedVoice: string = 'Auto-Female'): Promise<Buffer | null> {
  const cleanText = cleanTextForTTS(text);
  console.log('OpenAI TTS text length:', cleanText.length);
  
  const getVoice = (): string => {
    if (selectedVoice === 'Auto-Male') {
      return 'onyx';
    }
    if (selectedVoice === 'Auto-Female') {
      return 'nova';
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
        input: cleanText.slice(0, 200), // Preview only first 200 chars
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

// Generate audio using say command (macOS only)
async function generateWithSay(text: string, voice: string, rate: number): Promise<Buffer> {
  const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);
  
  try {
    await fs.promises.writeFile(tempTxt, text, 'utf-8');
    
    const command = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Executing:', command);
    
    const { stdout, stderr } = await execAsync(command, { shell: '/bin/bash' });
    if (stdout) console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
    
    const aiffBuffer = await fs.promises.readFile(tempAiff);
    console.log('AIFF size:', aiffBuffer.length, 'bytes');
    
    return aiffBuffer;
    
  } finally {
    await fs.promises.unlink(tempTxt).catch(() => {});
    await fs.promises.unlink(tempAiff).catch(() => {});
  }
}

// Convert AIFF to WAV using afconvert (macOS only)
async function convertWithAfconvert(aiffBuffer: Buffer): Promise<Buffer> {
  const tempAiff = path.join(os.tmpdir(), `temp_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `temp_${Date.now()}.wav`);
  
  try {
    await fs.promises.writeFile(tempAiff, aiffBuffer);
    const command = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
    console.log('Afconvert Command:', command);
    await execAsync(command, { shell: '/bin/bash' });
    const wavBuffer = await fs.promises.readFile(tempWav);
    console.log('WAV size from afconvert:', wavBuffer.length, 'bytes');
    return wavBuffer;
  } finally {
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
    console.log('Is Vercel?', isVercel);

    const cleanScript = cleanTextForTTS(script || '你好');
    console.log('Cleaned text:', cleanScript);

    const isCantonese = langCode === 'zh-HK' || language === 'Cantonese';
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

    // ============================================================
    // ON VERCEL - ALWAYS USE CLOUD TTS
    // ============================================================
    if (isVercel) {
      console.log('On Vercel - using cloud TTS (OpenAI)');
      
      // For Cantonese on Vercel, use Mandarin fallback
      if (isCantonese) {
        console.log('Cantonese on Vercel - using Mandarin fallback with OpenAI');
        try {
          const audioBuffer = await generateOpenAITTS(cleanScript, 'Mandarin', speed || 1.0, selectedVoice || 'Auto-Female');
          if (audioBuffer) {
            const audioData = new Uint8Array(audioBuffer);
            return new NextResponse(audioData, {
              status: 200,
              headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioData.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Voice-Used': selectedVoice || 'openai-fallback',
                'X-Language-Used': 'Cantonese (Mandarin fallback)',
                'X-Provider': 'OpenAI-TTS',
                'X-Environment': 'vercel',
              },
            });
          }
        } catch (error) {
          console.error('OpenAI TTS failed:', error);
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Cantonese voice generation unavailable on web. Please use the desktop app or select Mandarin/English.',
        }, { status: 503 });
      }
      
      // For Mandarin or English, use OpenAI TTS
      if (isMandarin || isEnglish) {
        console.log(`Using OpenAI TTS for ${language} on Vercel`);
        try {
          const audioBuffer = await generateOpenAITTS(cleanScript, language, speed || 1.0, selectedVoice || 'Auto-Female');
          if (audioBuffer) {
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
                'X-Environment': 'vercel',
              },
            });
          }
        } catch (error) {
          console.error('OpenAI TTS failed:', error);
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Voice generation temporarily unavailable. Please try again later.',
        }, { status: 503 });
      }
    }

    // ============================================================
    // LOCAL macOS - USE SAY + A F CONVERT
    // ============================================================
    console.log('Local macOS - using say + afconvert');
    
    // Get voice
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

    let speechRate = 160;
    if (isEnglish) speechRate = 185;
    if (speed) speechRate = Math.round(speed * 175);

    try {
      // Generate AIFF using say
      const aiffBuffer = await generateWithSay(cleanScript, voiceToUse, speechRate);
      
      if (!aiffBuffer || aiffBuffer.length === 0) {
        throw new Error('Audio generation produced empty file');
      }
      
      // Convert to WAV using afconvert
      const wavBuffer = await convertWithAfconvert(aiffBuffer);
      
      if (!wavBuffer || wavBuffer.length < 44) {
        throw new Error('Failed to convert AIFF to WAV');
      }
      
      console.log('Final WAV size:', wavBuffer.length, 'bytes');
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
          'X-Environment': 'local',
        },
      });
      
    } catch (error: any) {
      console.error('Local generation error:', error);
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