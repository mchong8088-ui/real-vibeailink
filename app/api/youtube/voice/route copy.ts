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

// ============================================================
// PAUSE MARKER PROCESSING
// ============================================================

function processTextWithPauses(text: string): string {
  let processed = text;
  
  console.log('Original text with markers:', processed);
  
  // Process [PAUSE Xs] markers
  processed = processed.replace(/\[PAUSE\s+(\d+\.?\d*)s\]/gi, (match, seconds) => {
    const pauseCount = Math.min(Math.round(parseFloat(seconds)), 5);
    console.log(`Found [PAUSE ${seconds}s] -> ${pauseCount} pauses`);
    return '. '.repeat(pauseCount * 2) + ' ';
  });
  
  // Process [PAUSE] (default)
  processed = processed.replace(/\[PAUSE\]/gi, () => {
    console.log('Found [PAUSE]');
    return '. . ';
  });
  
  // Process [SHORT_PAUSE]
  processed = processed.replace(/\[SHORT_PAUSE\]/gi, () => {
    console.log('Found [SHORT_PAUSE]');
    return ', ';
  });
  
  // Process [LONG_PAUSE]
  processed = processed.replace(/\[LONG_PAUSE\]/gi, () => {
    console.log('Found [LONG_PAUSE]');
    return '. . . . ';
  });
  
  // Process episode/scene markers
  processed = processed.replace(/(Episode\s+\d+:)/gi, (match) => {
    console.log('Found episode marker:', match);
    return `. . ${match} . . `;
  });
  
  processed = processed.replace(/(Scene\s+\d+:)/gi, (match) => {
    console.log('Found scene marker:', match);
    return `. . ${match} . . `;
  });
  
  processed = processed.replace(/(Part\s+\d+:)/gi, (match) => {
    console.log('Found part marker:', match);
    return `. . ${match} . . `;
  });
  
  // Process special markers
  processed = processed.replace(/\[SCENE\]/gi, '. . ');
  processed = processed.replace(/\[BREAK\]/gi, '. . . ');
  
  // Handle ellipsis
  processed = processed.replace(/…/g, '... ');
  
  // Clean up multiple spaces
  processed = processed.replace(/\s+/g, ' ');
  
  console.log('Processed text:', processed);
  return processed;
}

// ============================================================
// SCENE SPLITTING
// ============================================================

function splitIntoScenes(text: string): string[] {
  const scenePatterns = [
    /Episode \d+:/gi,
    /Scene \d+:/gi,
    /Part \d+:/gi,
    /\[SCENE \d+\]/gi,
    /=== Scene \d+ ===/gi,
    /--- Scene \d+ ---/gi,
    /【Scene \d+】/gi,
  ];
  
  for (const pattern of scenePatterns) {
    const testText = text;
    pattern.lastIndex = 0;
    if (pattern.test(testText)) {
      pattern.lastIndex = 0;
      const parts = testText.split(pattern);
      const scenes = parts.filter(p => p.trim().length > 0);
      if (scenes.length > 1) {
        console.log(`Split into ${scenes.length} scenes`);
        return scenes;
      }
    }
  }
  
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 1) {
    console.log(`Split into ${paragraphs.length} scenes using paragraphs`);
    return paragraphs;
  }
  
  console.log('No scene splitting applied, using whole text');
  return [text];
}

// ============================================================
// TTS GENERATION FUNCTIONS
// ============================================================

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

async function isSayAvailable(): Promise<boolean> {
  try {
    await execAsync('say -v "?"');
    return true;
  } catch {
    return false;
  }
}

async function generateOpenAITTS(text: string, language: string, speed: number = 1.0, selectedVoice: string = 'Auto-Female'): Promise<Buffer | null> {
  const processedText = processTextWithPauses(text);
  const cleanText = cleanTextForTTS(processedText);
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
  
  const maxChunkSize = 500;
  let chunks: string[] = [];
  
  if (cleanText.length <= maxChunkSize) {
    chunks = [cleanText];
  } else {
    const sentences = cleanText.match(/[^。！？!?，、；;,.，\n]+[。！？!?，、；;,.，\n]*/g) || [cleanText];
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    if (chunks.length === 0) chunks = [cleanText];
  }
  
  console.log(`Split into ${chunks.length} chunks for OpenAI TTS`);
  
  try {
    let combinedAudio: Buffer | null = null;
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating OpenAI chunk ${i + 1}/${chunks.length}`);
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: getVoice(),
          input: chunks[i],
          speed: Math.min(1.5, Math.max(0.5, speed)),
          response_format: 'wav',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI TTS error:', errorData);
        continue;
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);
      console.log(`OpenAI TTS chunk ${i + 1} generated, size:`, audioBuffer.length, 'bytes');
      
      if (combinedAudio) {
        combinedAudio = Buffer.concat([combinedAudio, audioBuffer]);
      } else {
        combinedAudio = audioBuffer;
      }
    }
    
    if (combinedAudio) {
      console.log('Combined OpenAI TTS size:', combinedAudio.length, 'bytes');
      return combinedAudio;
    }
    
    return null;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return null;
  }
}

async function generateWithSay(text: string, voice: string, rate: number): Promise<Buffer> {
  const processedText = processTextWithPauses(text);
  const cleanText = cleanTextForTTS(processedText);
  
  console.log('Final TTS text length:', cleanText.length);
  
  const tempTxt = path.join(os.tmpdir(), `full_${Date.now()}.txt`);
  const tempAiff = path.join(os.tmpdir(), `full_${Date.now()}.aiff`);
  const tempWav = path.join(os.tmpdir(), `full_${Date.now()}.wav`);
  
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

// ============================================================
// AUDIO DURATION FUNCTIONS
// ============================================================

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

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateSilence(durationSeconds: number): Buffer {
  if (durationSeconds <= 0) return Buffer.alloc(0);
  
  const sampleRate = 22050;
  const bytesPerSecond = sampleRate * 2;
  const silenceSize = Math.floor(durationSeconds * bytesPerSecond);
  console.log(`Generating ${durationSeconds}s silence (${silenceSize} bytes)`);
  return Buffer.alloc(silenceSize, 0);
}

// ============================================================
// MAIN POST FUNCTION
// ============================================================

export async function POST(req: Request) {
  try {
    const { userId, script, langCode, language, selectedVoice, speed, format = 'wav', scenePause = 0 } = await req.json();

    console.log('========== FULL GENERATION REQUEST ==========');
    console.log('User ID:', userId);
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Selected voice:', selectedVoice);
    console.log('Format requested:', format);
    console.log('Scene pause:', scenePause, 'seconds');

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
    // CHECK IF SAY COMMAND IS AVAILABLE
    // ============================================================
    const sayAvailable = await isSayAvailable();
    console.log('Say command available:', sayAvailable);

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

    let speechRate = 160;
    if (isEnglish) speechRate = 185;
    if (speed) speechRate = Math.round(speed * 175);

    // ============================================================
    // SPLIT INTO SCENES IF PAUSE REQUESTED
    // ============================================================
    let scenes: string[] = [];
    if (scenePause > 0) {
      scenes = splitIntoScenes(cleanScript);
      console.log(`Split into ${scenes.length} scenes with ${scenePause}s pause between`);
    } else {
      scenes = [cleanScript];
    }

    // ============================================================
    // GENERATE AUDIO FOR EACH SCENE
    // ============================================================
    let combinedAudio: Buffer | null = null;
    const silence = generateSilence(scenePause);
    const sceneAudioBuffers: Buffer[] = [];

    try {
      for (let i = 0; i < scenes.length; i++) {
        console.log(`Generating scene ${i + 1}/${scenes.length}`);
        
        let sceneAudio: Buffer | null = null;
        const sceneText = scenes[i];
        
        if (sayAvailable) {
          try {
            sceneAudio = await generateWithSay(sceneText, voiceToUse, speechRate);
            console.log(`Scene ${i + 1} local TTS generated: ${sceneAudio.length} bytes`);
          } catch (localError) {
            console.error(`Scene ${i + 1} local TTS failed:`, localError);
            const fallbackLanguage = isCantonese ? 'Mandarin' : language;
            sceneAudio = await generateOpenAITTS(sceneText, fallbackLanguage, speed || 1.0, selectedVoice || 'Auto-Female');
            if (sceneAudio) {
              console.log(`Scene ${i + 1} cloud fallback generated: ${sceneAudio.length} bytes`);
            }
          }
        } else {
          const cloudLanguage = isCantonese ? 'Mandarin' : language;
          sceneAudio = await generateOpenAITTS(sceneText, cloudLanguage, speed || 1.0, selectedVoice || 'Auto-Female');
          if (sceneAudio) {
            console.log(`Scene ${i + 1} cloud TTS generated: ${sceneAudio.length} bytes`);
          }
        }
        
        if (sceneAudio) {
          sceneAudioBuffers.push(sceneAudio);
          if (combinedAudio) {
            if (scenePause > 0 && i > 0) {
              combinedAudio = Buffer.concat([combinedAudio, silence, sceneAudio]);
              console.log(`Added ${scenePause}s silence between scenes`);
            } else {
              combinedAudio = Buffer.concat([combinedAudio, sceneAudio]);
            }
          } else {
            combinedAudio = sceneAudio;
          }
        }
      }

      if (!combinedAudio) {
        throw new Error('No audio generated for any scene');
      }

      console.log(`Total audio size: ${combinedAudio.length} bytes`);
      console.log(`Number of scenes: ${sceneAudioBuffers.length}`);

      // ============================================================
      // GET ACCURATE AUDIO DURATION
      // ============================================================
      
      let audioDuration = 0;
      try {
        // Write combined audio to temp file for duration check
        const tempDurationWav = path.join(os.tmpdir(), `duration_${Date.now()}.wav`);
        await fs.promises.writeFile(tempDurationWav, combinedAudio);
        
        // Try ffprobe first
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempDurationWav}"`);
        await fs.promises.unlink(tempDurationWav).catch(() => {});
        
        audioDuration = parseFloat(stdout.trim());
        if (!isNaN(audioDuration) && audioDuration > 0) {
          console.log('Audio duration from ffprobe:', audioDuration, 'seconds');
        } else {
          // Fallback: estimate from file size
          const estimatedDuration = combinedAudio.length / (22050 * 2);
          audioDuration = estimatedDuration;
          console.log('Estimated duration from file size:', audioDuration, 'seconds');
        }
      } catch (e) {
        console.warn('Could not get audio duration, using fallback:', e);
        // Estimate from file size
        const estimatedDuration = combinedAudio.length / (22050 * 2);
        audioDuration = estimatedDuration;
        console.log('Estimated duration from file size (fallback):', audioDuration, 'seconds');
      }

      // Ensure we have a valid duration
      if (audioDuration <= 0) {
        const isChinese = /[\u4e00-\u9fff]/.test(cleanScript);
        audioDuration = isChinese 
          ? Math.max(1.5, cleanScript.length / 4)
          : Math.max(1.5, cleanScript.split(/\s+/).length / 3);
        if (scenePause > 0 && scenes.length > 1) {
          audioDuration += scenePause * (scenes.length - 1);
        }
        console.log('Estimated duration (fallback):', audioDuration, 'seconds');
      }

      console.log('Final audio duration:', audioDuration, 'seconds');
      console.log('Formatted duration:', formatDuration(audioDuration));

      // ============================================================
      // CONVERT TO MP3 IF REQUESTED
      // ============================================================
      
      let audioBuffer = combinedAudio;
      let audioFormat = 'wav';

      if (format === 'mp3') {
        try {
          audioBuffer = await convertWavToMp3(combinedAudio);
          audioFormat = 'mp3';
          console.log('MP3 conversion successful, size:', audioBuffer.length);
        } catch (mp3Error) {
          console.error('MP3 conversion failed, falling back to WAV:', mp3Error);
          audioBuffer = combinedAudio;
          audioFormat = 'wav';
        }
      }

      console.log('Final audio size:', audioBuffer.length);
      console.log('Final format:', audioFormat);
      console.log('Scenes processed:', scenes.length);
      console.log('========== FULL GENERATION COMPLETE ==========');

      // ============================================================
      // DEDUCT CREDITS
      // ============================================================
      
      const creditsToDeduct = Math.max(2, Math.ceil(cleanScript.length / 100) + (scenes.length > 1 ? scenes.length : 0));
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
        scenesProcessed: scenes.length,
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