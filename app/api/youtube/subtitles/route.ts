import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Clean text for subtitle generation
function cleanTextForSubtitles(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Generate SRT format
function generateSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments.map((seg, i) => 
    `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`
  ).join('\n');
}

// Format time for SRT (HH:MM:SS,mmm)
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

// Format time for YouTube Chapters (MM:SS)
function formatTimeForChapters(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// Generate YouTube Chapters
function generateYouTubeChapters(segments: Array<{ start: number; end: number; text: string }>): string {
  if (segments.length === 0) return '';
  
  const totalChapters = Math.min(10, Math.max(2, Math.floor(segments.length / 4)));
  const chapterInterval = Math.max(2, Math.floor(segments.length / totalChapters));
  
  const chapters: Array<{ time: number; text: string }> = [];
  
  for (let i = 0; i < segments.length && chapters.length < totalChapters; i += chapterInterval) {
    const seg = segments[i];
    let title = seg.text.slice(0, 40);
    if (title.length > 30) {
      title = title.slice(0, 30) + '...';
    }
    chapters.push({
      time: seg.start,
      text: title
    });
  }
  
  return chapters.map(ch => `${formatTimeForChapters(ch.time)} ${ch.text}`).join('\n');
}

// Math-based fallback duration generator
function generateSegmentsWithDuration(
  text: string, 
  totalDuration: number
): Array<{ start: number; end: number; text: string }> {
  const segments: Array<{ start: number; end: number; text: string }> = [];
  const sentences = text.match(/[^。！？!?，、；;,.，\n]+[。！？!?，、；;,.，\n]*/g) || [text];
  const totalChars = sentences.reduce((sum, s) => sum + s.replace(/\s/g, '').length, 0);
  
  if (totalChars === 0) return segments;
  
  const pauseDuration = 0.15;
  const totalPauses = sentences.length - 1;
  const availableDuration = Math.max(0.1, totalDuration - (totalPauses * pauseDuration));
  const durationPerChar = availableDuration / totalChars;
  
  let currentTime = 0;
  for (const sentence of sentences) {
    const cleanSentence = cleanTextForSubtitles(sentence);
    if (!cleanSentence) continue;
    
    const charCount = cleanSentence.replace(/\s/g, '').length;
    const duration = Math.max(0.3, charCount * durationPerChar);
    
    segments.push({
      start: currentTime,
      end: currentTime + duration,
      text: cleanSentence
    });
    
    currentTime += duration + pauseDuration;
  }
  
  if (segments.length > 0 && segments[segments.length - 1].end < totalDuration) {
    segments[segments.length - 1].end = totalDuration;
  }
  
  return segments;
}

export async function POST(req: Request) {
  try {
    const { script, audioBase64, language = 'Cantonese', targetLanguage, totalDuration } = await req.json();

    console.log('========== SUBTITLE GENERATION ==========');
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Has audioBase64:', !!audioBase64);

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    const cleanScript = cleanTextForSubtitles(script);
    let segments: Array<{ start: number; end: number; text: string }> = [];
    let durationSource = 'estimated';

    // 1. Primary Method: Speech-To-Text Sync using OpenAI Whisper
    if (openai && audioBase64) {
      try {
        console.log('Attempting OpenAI Whisper timestamp sync from MP3...');
        
        // Clean base64 and create Blob/File object for OpenAI API
        const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '').replace(/\s/g, '');
        const audioBuffer = Buffer.from(cleanBase64, 'base64');
        const audioFile = new File([audioBuffer], "speech.mp3", { type: "audio/mp3" });

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
          prompt: cleanScript, // Uses original Cantonese/Traditional Script as reference
          language: "zh"
        });

        if (transcription.segments && transcription.segments.length > 0) {
          segments = transcription.segments.map(seg => ({
            start: seg.start,
            end: seg.end,
            text: seg.text.trim()
          }));
          durationSource = 'whisper_stt';
          console.log(`Whisper generated ${segments.length} accurate audio segments.`);
        }
      } catch (sttError) {
        console.error('Whisper STT failed, using mathematical fallback:', sttError);
      }
    }

    // 2. Fallback Method: Math estimation if STT is unavailable or fails
    if (segments.length === 0) {
      console.log('Using mathematical timing fallback');
      const duration = typeof totalDuration === 'number' ? totalDuration : parseFloat(totalDuration) || 0;
      segments = generateSegmentsWithDuration(cleanScript, duration);
      durationSource = duration > 0 ? 'audio_duration' : 'estimated';
    }

    // Optional translation prefixing
    let finalSegments = segments;
    if (targetLanguage && targetLanguage !== 'None' && targetLanguage !== 'Original') {
      const prefix = `[${targetLanguage}] `;
      finalSegments = segments.map(seg => ({
        ...seg,
        text: prefix + seg.text
      }));
    }

    // Generate output assets
    const srtContent = generateSRT(finalSegments);
    const youtubeChapters = generateYouTubeChapters(finalSegments);
    const totalDurationActual = finalSegments.length > 0 ? finalSegments[finalSegments.length - 1].end : 0;

    return NextResponse.json({
      success: true,
      srt: srtContent,
      youtubeChapters: youtubeChapters,
      segments: finalSegments,
      metadata: {
        totalDuration: totalDurationActual,
        segmentCount: finalSegments.length,
        language: language,
        targetLanguage: targetLanguage || 'None',
        durationSource: durationSource
      }
    });

  } catch (error) {
    console.error("Subtitles error:", error);
    return NextResponse.json({ 
      error: "Failed to generate subtitles",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}