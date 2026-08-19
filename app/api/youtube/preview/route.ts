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

export async function POST(req: Request) {
  try {
    const { script, langCode, language, speed, voiceType, selectedVoice } = await req.json();

    console.log('========== PREVIEW REQUEST ==========');
    console.log('Original script:', script);
    console.log('Language:', language);

    // Clean the text
    const cleanScript = cleanTextForTTS(script || '你好');
    console.log('Cleaned text:', cleanScript);

    // Determine language
    const isCantonese = langCode === 'zh-HK' || language === 'Cantonese';
    const isMandarin = langCode === 'zh-CN' || language === 'Mandarin';
    const isEnglish = langCode === 'en-US' || language === 'English';

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

    // Speech rate
    let speechRate = 160;
    if (isEnglish) speechRate = 185;
    if (speed) speechRate = Math.round(speed * 175);

    // Use temporary files
    const tempTxt = path.join(os.tmpdir(), `preview_${Date.now()}.txt`);
    const tempAiff = path.join(os.tmpdir(), `preview_${Date.now()}.aiff`);
    const tempWav = path.join(os.tmpdir(), `preview_${Date.now()}.wav`);

    try {
      // Write text to file
      await fs.promises.writeFile(tempTxt, cleanScript, 'utf-8');

      // Step 1: Generate AIFF using say
      const sayCommand = `say -v "${voiceToUse}" -r ${speechRate} -f "${tempTxt}" -o "${tempAiff}"`;
      console.log('Say Command:', sayCommand);
      await execAsync(sayCommand);

      // Step 2: Convert AIFF to WAV using afconvert (macOS built-in)
      const afconvertCommand = `afconvert -f WAVE -d LEI16@22050 "${tempAiff}" "${tempWav}"`;
      console.log('Afconvert Command:', afconvertCommand);
      
      try {
        await execAsync(afconvertCommand);
        console.log('afconvert succeeded');
      } catch (afconvertError) {
        console.error('afconvert failed, trying alternative method...');
        // If afconvert fails, try using the built-in conversion
        const altCommand = `afconvert -f WAVE -d LEI16 "${tempAiff}" "${tempWav}"`;
        await execAsync(altCommand);
      }

      // Read the WAV file
      const wavBuffer = await fs.promises.readFile(tempWav);
      console.log('WAV file size:', wavBuffer.length, 'bytes');

      if (!wavBuffer || wavBuffer.length === 0) {
        throw new Error('Audio conversion produced empty file');
      }

      // Verify WAV header
      const isWav = wavBuffer.toString('ascii', 0, 4) === 'RIFF';
      console.log('Is valid WAV?', isWav);

      if (!isWav) {
        console.error('Invalid WAV file, using fallback method');
        // Fallback: Try to create WAV manually
        const aiffBuffer = await fs.promises.readFile(tempAiff);
        const wavFallback = createWavFromAiff(aiffBuffer);
        if (wavFallback.length > 44) {
          console.log('Fallback WAV size:', wavFallback.length);
          return new NextResponse(wavFallback, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': wavFallback.length.toString(),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Voice-Used': voiceToUse,
              'X-Method': 'fallback',
            },
          });
        }
      }

      console.log('========== PREVIEW COMPLETE ==========');

      return new NextResponse(wavBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': wavBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Voice-Used': voiceToUse,
          'X-Language-Used': language,
          'X-Method': 'afconvert',
        },
      });

    } finally {
      // Clean up temporary files
      await fs.promises.unlink(tempTxt).catch(() => {});
      await fs.promises.unlink(tempAiff).catch(() => {});
      await fs.promises.unlink(tempWav).catch(() => {});
    }

  } catch (error: any) {
    console.error('Preview TTS Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'TTS generation failed',
    }, { status: 500 });
  }
}

// Fallback: Manual AIFF to WAV conversion
function createWavFromAiff(aiffBuffer: Buffer): Buffer {
  try {
    // Find SSND chunk
    const ssndIndex = aiffBuffer.indexOf('SSND');
    if (ssndIndex === -1) {
      console.warn('SSND chunk not found');
      return Buffer.alloc(0);
    }

    // Extract audio data
    const chunkSize = aiffBuffer.readUInt32BE(ssndIndex + 4);
    const audioData = aiffBuffer.slice(ssndIndex + 16, ssndIndex + 16 + chunkSize - 8);
    console.log('Extracted audio data size:', audioData.length);

    // Create WAV with standard format
    const sampleRate = 22050;
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length;

    const header = Buffer.alloc(44);
    
    // RIFF
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    
    // fmt
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    
    // data
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, audioData]);
  } catch (error) {
    console.error('Fallback conversion error:', error);
    return Buffer.alloc(0);
  }
}