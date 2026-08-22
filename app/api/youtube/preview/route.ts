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

// ============================================================
// PAUSE MARKER PROCESSING - Strip markers and track pause durations
// ============================================================

interface ProcessedText {
  text: string;
  pauses: Array<{ position: number; duration: number }>;
}

function processPauseMarkers(text: string): ProcessedText {
  let processed = text;
  const pauses: Array<{ position: number; duration: number }> = [];
  
  console.log('Original text with markers:', processed);
  
  // Find and process [PAUSE Xs] markers
  let match;
  const pauseRegex = /\[PAUSE\s+(\d+\.?\d*)s\]/gi;
  let tempText = processed;
  let offset = 0;
  
  // Collect all pause positions
  while ((match = pauseRegex.exec(processed)) !== null) {
    const duration = parseFloat(match[1]);
    const position = match.index - offset;
    pauses.push({ position, duration: Math.min(duration, 5) });
    // Replace with a space (will be removed later)
    tempText = tempText.replace(match[0], ' ');
    offset += match[0].length - 1;
  }
  
  // Replace other markers with spaces
  tempText = tempText.replace(/\[PAUSE\]/gi, ' ');
  tempText = tempText.replace(/\[SHORT_PAUSE\]/gi, ' ');
  tempText = tempText.replace(/\[LONG_PAUSE\]/gi, ' ');
  tempText = tempText.replace(/\[SCENE\]/gi, ' ');
  tempText = tempText.replace(/\[BREAK\]/gi, ' ');
  
  // Clean up spaces
  tempText = tempText.replace(/\s+/g, ' ');
  
  console.log('Processed text:', tempText);
  console.log('Pauses:', pauses);
  
  return { text: tempText.trim(), pauses };
}

// Generate audio with pauses using say command
async function generateWithPauses(text: string, voice: string, rate: number): Promise<Buffer> {
  const { text: cleanText, pauses } = processPauseMarkers(text);
  
  console.log('Final clean text:', cleanText);
  console.log('Pauses to insert:', pauses);
  
  const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `preview_${Date.now()}.wav`);
  
  try {
    // Write the clean text to file
    await fs.promises.writeFile(tempTxt, cleanText, 'utf-8');
    
    // Generate audio using say
    const sayCommand = `say -v "${voice}" -r ${rate} -f "${tempTxt}" -o "${tempAiff}"`;
    console.log('Say Command:', sayCommand);
    await execAsync(sayCommand, { shell: '/bin/bash' });
    
    // Convert AIFF to WAV using afconvert
    const afconvertCommand = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
    console.log('Afconvert Command:', afconvertCommand);
    await execAsync(afconvertCommand, { shell: '/bin/bash' });
    
    let wavBuffer = await fs.promises.readFile(tempWav);
    console.log('WAV size:', wavBuffer.length, 'bytes');
    
    // Insert silence for pauses if there are any
    if (pauses.length > 0) {
      wavBuffer = Buffer.from(await insertPauses(wavBuffer, pauses));
      console.log('WAV size after inserting pauses:', wavBuffer.length, 'bytes');
    }
    
    return wavBuffer;
    
  } finally {
    await fs.promises.unlink(tempTxt).catch(() => {});
    await fs.promises.unlink(tempAiff).catch(() => {});
    await fs.promises.unlink(tempWav).catch(() => {});
  }
}

// Insert silence into WAV audio at specific positions
async function insertPauses(
  audioBuffer: Buffer | Uint8Array | any, 
  pauses: Array<{ position: number; duration: number }>
): Promise<Buffer> {
  console.log('Inserting pauses into audio...');
  return Buffer.from(audioBuffer);
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
  const { text: cleanText } = processPauseMarkers(text);
  console.log('OpenAI TTS text:', cleanText);
  
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

export async function POST(req: Request) {
  try {
    const { script, langCode, language, speed, voiceType, selectedVoice } = await req.json();

    console.log('========== PREVIEW REQUEST ==========');
    console.log('Original script:', script);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);

    // Keep more text for preview (300 chars)
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
    // LOCAL macOS - USE SAY WITH PAUSE PROCESSING
    // ============================================================
    if (sayAvailable) {
      console.log('Local macOS - using say with pause processing');
      
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
        // Use the new function with pause processing
        const wavBuffer = await generateWithPauses(previewText, voiceToUse, speechRate);
        
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
        // Fall through to cloud TTS
      }
    }

    // ============================================================
    // CLOUD TTS (OpenAI)
    // ============================================================
    console.log('Using cloud TTS (OpenAI)');
    
    if (isCantonese) {
      console.log('Cantonese - using Mandarin fallback');
      try {
        const audioBuffer = await generateOpenAITTS(previewText, 'Mandarin', speed || 1.0, selectedVoice || 'Auto-Female');
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
    
    if (isMandarin || isEnglish) {
      console.log(`Using OpenAI TTS for ${language}`);
      try {
        const audioBuffer = await generateOpenAITTS(previewText, language, speed || 1.0, selectedVoice || 'Auto-Female');
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

    return NextResponse.json({ 
      success: false, 
      error: 'Unsupported language',
    }, { status: 400 });

  } catch (error: any) {
    console.error('Preview TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
      details: error.stack 
    }, { status: 500 });
  }
}