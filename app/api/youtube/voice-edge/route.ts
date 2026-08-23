// /app/api/youtube/voice-edge/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateSpeech, getFallbackVoice } from '@/lib/edge-tts-wrapper';

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

function processTextWithPauses(text: string): string {
  let processed = text;
  
  // Process [PAUSE Xs] markers
  processed = processed.replace(/\[PAUSE\s+(\d+\.?\d*)s\]/gi, (match, seconds) => {
    const pauseCount = Math.min(Math.round(parseFloat(seconds)), 5);
    return '. '.repeat(pauseCount * 2) + ' ';
  });
  
  processed = processed.replace(/\[PAUSE\]/gi, '. . ');
  processed = processed.replace(/\[SHORT_PAUSE\]/gi, ', ');
  processed = processed.replace(/\[LONG_PAUSE\]/gi, '. . . . ');
  
  processed = processed.replace(/(Episode\s+\d+:)/gi, (match) => `. . ${match} . . `);
  processed = processed.replace(/(Scene\s+\d+:)/gi, (match) => `. . ${match} . . `);
  processed = processed.replace(/(Part\s+\d+:)/gi, (match) => `. . ${match} . . `);
  
  processed = processed.replace(/\[SCENE\]/gi, '. . ');
  processed = processed.replace(/\[BREAK\]/gi, '. . . ');
  processed = processed.replace(/…/g, '... ');
  processed = processed.replace(/\s+/g, ' ');
  
  return processed;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function POST(req: Request) {
  try {
    // 1. Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Please login to continue.'
      }, { status: 401 });
    }

    // 2. Get request body
    const { script, voiceName, speed = 1.0, language, format = 'mp3' } = await req.json();
    
    if (!script || !voiceName) {
      return NextResponse.json({
        success: false,
        error: 'Script and voice name are required.'
      }, { status: 400 });
    }

    // 3. Check credits
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const charCount = script.length;
    const baseCredits = charCount < 500 ? 2 : (charCount > 2000 ? 10 : 5);
    const estimatedCredits = baseCredits * 2;

    if ((profile?.credits || 0) < estimatedCredits) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. Need ${estimatedCredits} credits. You have ${profile?.credits || 0}.`
      }, { status: 402 });
    }

    // 4. Process text
    const processedText = processTextWithPauses(script);
    const cleanText = cleanTextForTTS(processedText);
    console.log('🔊 Edge TTS: Text length:', cleanText.length);
    console.log('🔊 Edge TTS: Voice name:', voiceName);
    console.log('🔊 Edge TTS: Speed:', speed);

    // 5. Generate speech using Edge TTS via wrapper
    try {
      // Use the wrapper to generate speech
      const audioBuffer = await generateSpeech(cleanText, voiceName, { speed });

      console.log('🔊 Edge TTS: Generated audio size:', audioBuffer.length, 'bytes');

      // 6. Calculate duration (estimate)
      const estimatedDuration = (cleanText.length / 150) * 60;
      
      // If we can, get more accurate duration using ffprobe
      let accurateDuration = estimatedDuration;
      try {
        // Use ffprobe if available
        const tempFile = path.join(os.tmpdir(), `edge_tts_${Date.now()}.mp3`);
        fs.writeFileSync(tempFile, audioBuffer);
        
        try {
          const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFile}"`);
          const duration = parseFloat(stdout.trim());
          if (!isNaN(duration) && duration > 0) {
            accurateDuration = duration;
            console.log('🔊 Edge TTS: Accurate duration from ffprobe:', accurateDuration);
          }
        } catch (ffprobeError) {
          console.log('🔊 Edge TTS: Using estimated duration:', accurateDuration);
        }
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (unlinkError) {
          // Ignore unlink errors
        }
      } catch (durationError) {
        console.log('🔊 Edge TTS: Using estimated duration:', accurateDuration);
      }

      // 7. Deduct credits
      await supabaseAdmin
        .from('profiles')
        .update({ credits: (profile?.credits || 0) - estimatedCredits })
        .eq('id', user.id);

      // 8. Convert to base64
      const audioBase64 = audioBuffer.toString('base64');

      console.log('🔊 Edge TTS: Success! Duration:', accurateDuration, 'seconds');

      return NextResponse.json({
        success: true,
        audio: audioBase64,
        format: 'mp3',
        duration: accurateDuration,
        durationFormatted: formatDuration(accurateDuration),
        creditsUsed: estimatedCredits,
        creditsRemaining: (profile?.credits || 0) - estimatedCredits,
        voiceName: voiceName,
        provider: 'edge'
      });

    } catch (error: any) {
      console.error('❌ Edge TTS error:', error);
      
      // Fallback: Try with a different voice if the requested one fails
      try {
        console.log('🔊 Edge TTS: Trying fallback voice...');
        const fallbackVoice = getFallbackVoice(voiceName);
        console.log('🔊 Edge TTS: Fallback voice:', fallbackVoice);
        
        const audioBuffer = await generateSpeech(cleanText, fallbackVoice, { speed: 1.0 });
        
        const audioBase64 = audioBuffer.toString('base64');
        const estimatedDuration = (cleanText.length / 150) * 60;

        await supabaseAdmin
          .from('profiles')
          .update({ credits: (profile?.credits || 0) - estimatedCredits })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          audio: audioBase64,
          format: 'mp3',
          duration: estimatedDuration,
          durationFormatted: formatDuration(estimatedDuration),
          creditsUsed: estimatedCredits,
          creditsRemaining: (profile?.credits || 0) - estimatedCredits,
          voiceName: fallbackVoice,
          provider: 'edge',
          fallbackUsed: true
        });
      } catch (fallbackError) {
        console.error('❌ Edge TTS fallback also failed:', fallbackError);
        return NextResponse.json({
          success: false,
          error: 'Edge TTS generation failed: ' + error.message
        }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('❌ Voice Edge API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Voice generation failed.'
    }, { status: 500 });
  }
}