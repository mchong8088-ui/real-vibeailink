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

// Check if say command is available
async function isSayAvailable(): Promise<boolean> {
  try {
    await execAsync('say -v "?"');
    return true;
  } catch {
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
        input: cleanText.slice(0, 200),
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
  const tempWav = path.join(os.tmpdir(), `preview_${Date.now()}.wav`);
  
  try {
    await fs.promises.writeFile(tempTxt, text, 'utf-8');
    
    const sayCommand = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Say Command:', sayCommand);
    await execAsync(sayCommand, { shell: '/bin/bash' });
    
    // Convert using afconvert
    const afconvertCommand = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
    console.log('Afconvert Command:', afconvertCommand);
    await execAsync(afconvertCommand, { shell: '/bin/bash' });
    
    const wavBuffer = await fs.promises.readFile(tempWav);
    console.log('WAV size:', wavBuffer.length, 'bytes');
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
    // CHECK IF SAY COMMAND IS AVAILABLE
    // ============================================================
    const sayAvailable = await isSayAvailable();
    console.log('Say command available:', sayAvailable);

    // ============================================================
    // IF SAY IS NOT AVAILABLE -> USE CLOUD TTS
    // ============================================================
    if (!sayAvailable) {
      console.log('Say command not available - using cloud TTS (OpenAI)');
      
      // For Cantonese, use Mandarin fallback
      if (isCantonese) {
        console.log('Cantonese on cloud - using Mandarin fallback');
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
                'X-Environment': 'cloud',
              },
            });
          }
        } catch (error) {
          console.error('OpenAI TTS failed:', error);
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Cantonese voice generation unavailable. Please select Mandarin or English for web.',
        }, { status: 503 });
      }
      
      // For Mandarin or English, use OpenAI TTS
      if (isMandarin || isEnglish) {
        console.log(`Using OpenAI TTS for ${language}`);
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
                'X-Environment': 'cloud',
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
      // Generate audio using say + afconvert
      const wavBuffer = await generateWithSay(cleanScript, voiceToUse, speechRate);
      
      if (!wavBuffer || wavBuffer.length < 44) {
        throw new Error('Failed to generate valid WAV');
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
      // If local fails, try cloud fallback
      console.log('Local failed, trying cloud fallback...');
      try {
        const audioBuffer = await generateOpenAITTS(cleanScript, isCantonese ? 'Mandarin' : language, speed || 1.0, selectedVoice || 'Auto-Female');
        if (audioBuffer) {
          const audioData = new Uint8Array(audioBuffer);
          return new NextResponse(audioData, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': audioData.length.toString(),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Voice-Used': 'cloud-fallback',
              'X-Language-Used': isCantonese ? 'Cantonese (Mandarin fallback)' : language,
              'X-Provider': 'OpenAI-TTS',
              'X-Environment': 'cloud-fallback',
            },
          });
        }
      } catch (fallbackError) {
        console.error('Cloud fallback also failed:', fallbackError);
      }
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