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

// Process pause markers
function processPauseMarkers(text: string): { text: string; pauses: any[] } {
  let processed = text;
  const pauses: any[] = [];
  
  // Replace markers with spaces
  processed = processed.replace(/\[PAUSE\s+(\d+\.?\d*)s\]/gi, ' ');
  processed = processed.replace(/\[PAUSE\]/gi, ' ');
  processed = processed.replace(/\[SHORT_PAUSE\]/gi, ' ');
  processed = processed.replace(/\[LONG_PAUSE\]/gi, ' ');
  processed = processed.replace(/\[SCENE\]/gi, ' ');
  processed = processed.replace(/\[BREAK\]/gi, ' ');
  
  // Clean up spaces
  processed = processed.replace(/\s+/g, ' ');
  
  return { text: processed.trim(), pauses };
}

// Generate TTS using macOS say command
async function generateWithSay(text: string, voice: string, rate: number): Promise<Buffer> {
  const { text: cleanText } = processPauseMarkers(text);
  
  const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `preview_${Date.now()}.wav`);
  
  try {
    await fs.promises.writeFile(tempTxt, cleanText, 'utf-8');
    
    const sayCommand = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Say Command:', sayCommand);
    await execAsync(sayCommand, { shell: '/bin/bash' });
    
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

// Check if say command is available
async function isSayAvailable(): Promise<boolean> {
  try {
    await execAsync('say -v "?"');
    return true;
  } catch {
    return false;
  }
}

// Generate OpenAI TTS fallback
async function generateOpenAITTS(text: string, language: string, speed: number = 1.0): Promise<Buffer | null> {
  const { text: cleanText } = processPauseMarkers(text);
  console.log('OpenAI TTS text:', cleanText);
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: cleanText.slice(0, 200),
        speed: Math.min(1.5, Math.max(0.5, speed)),
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      console.error('OpenAI TTS error:', await response.text());
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

export async function POST(req: Request) {
  try {
    const { script, langCode, language, speed, voiceType, selectedVoice } = await req.json();

    console.log('========== PREVIEW REQUEST ==========');
    console.log('Original script:', script);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);

    // Preview text (300 chars max)
    let cleanScript = cleanTextForTTS(script || '你好');
    
    let previewText = cleanScript;
    if (cleanScript.length > 300) {
      const cutPoint = cleanScript.lastIndexOf('。', 300);
      if (cutPoint > 50) {
        previewText = cleanScript.slice(0, cutPoint + 1);
      } else {
        previewText = cleanScript.slice(0, 300);
      }
    }
    
    console.log('Preview text length:', previewText.length);

    const isCantonese = langCode === 'zh-HK' || language === 'Cantonese';
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

    const sayAvailable = await isSayAvailable();
    console.log('Say command available:', sayAvailable);

    // ============================================================
    // LOCAL MACOS TTS
    // ============================================================
    if (sayAvailable) {
      console.log('Local macOS - using say');
      
      let voiceToUse = selectedVoice;
      
      // Auto-select voice if not specified
      if (!voiceToUse || voiceToUse === 'Auto-Male' || voiceToUse === 'Auto-Female') {
        if (isCantonese) {
          // Try Cantonese voices
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
        const wavBuffer = await generateWithSay(previewText, voiceToUse, speechRate);
        
        if (wavBuffer && wavBuffer.length >= 44) {
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
        }
      } catch (error: any) {
        console.error('Local generation error:', error);
      }
    }

    // ============================================================
    // CLOUD TTS (OpenAI) FALLBACK
    // ============================================================
    console.log('Using cloud TTS (OpenAI) fallback');
    
    try {
      const audioBuffer = await generateOpenAITTS(previewText, language, speed || 1.0);
      if (audioBuffer) {
        const audioData = new Uint8Array(audioBuffer);
        return new NextResponse(audioData, {
          status: 200,
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': audioData.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Voice-Used': 'openai-fallback',
            'X-Language-Used': language,
            'X-Provider': 'OpenAI-TTS',
            'X-Environment': 'cloud',
          },
        });
      }
    } catch (error) {
      console.error('OpenAI TTS fallback failed:', error);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Voice generation unavailable',
    }, { status: 503 });

  } catch (error: any) {
    console.error('Preview TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
    }, { status: 500 });
  }
}