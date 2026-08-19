import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Clean text for subtitle generation
function cleanTextForSubtitles(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate subtitle segments with actual audio duration
function generateSegmentsWithDuration(
  text: string, 
  totalDuration: number,
  language: string
): Array<{start: number; end: number; text: string}> {
  const segments: Array<{start: number; end: number; text: string}> = [];
  
  // Split by sentences (handles Chinese and English punctuation)
  const sentences = text.match(/[^。！？!?，、；;,.，\n]+[。！？!?，、；;,.，\n]*/g) || [text];
  
  // Calculate total characters and duration per character
  const totalChars = sentences.reduce((sum, s) => sum + s.replace(/\s/g, '').length, 0);
  
  if (totalChars === 0 || totalDuration === 0) {
    // Fallback to estimation
    return generateSegmentsFromText(text, 4);
  }
  
  // Duration per character (account for pauses between sentences)
  const pauseDuration = 0.3;
  const totalPauses = sentences.length - 1;
  const totalPauseTime = totalPauses * pauseDuration;
  const availableDuration = totalDuration - totalPauseTime;
  const durationPerChar = availableDuration / totalChars;
  
  let currentTime = 0;
  
  for (const sentence of sentences) {
    const cleanSentence = cleanTextForSubtitles(sentence);
    if (!cleanSentence) continue;
    
    const charCount = cleanSentence.replace(/\s/g, '').length;
    // Duration based on actual audio timing
    const duration = Math.max(0.5, charCount * durationPerChar);
    
    segments.push({
      start: currentTime,
      end: currentTime + duration,
      text: cleanSentence
    });
    
    currentTime += duration + pauseDuration;
  }
  
  // If segments don't fill the duration, adjust the last segment
  if (segments.length > 0 && currentTime < totalDuration) {
    const lastSegment = segments[segments.length - 1];
    const extraTime = totalDuration - currentTime;
    lastSegment.end += extraTime;
  }
  
  return segments;
}

// Fallback: Generate subtitle segments from text with estimated timing
function generateSegmentsFromText(
  text: string, 
  charsPerSecond: number = 4
): Array<{start: number; end: number; text: string}> {
  const segments: Array<{start: number; end: number; text: string}> = [];
  
  const sentences = text.match(/[^。！？!?，、；;,.，\n]+[。！？!?，、；;,.，\n]*/g) || [text];
  
  let currentTime = 0;
  const pauseDuration = 0.3;
  
  for (const sentence of sentences) {
    const cleanSentence = cleanTextForSubtitles(sentence);
    if (!cleanSentence) continue;
    
    const charCount = cleanSentence.replace(/\s/g, '').length;
    const isChinese = /[\u4e00-\u9fff]/.test(cleanSentence);
    
    let duration: number;
    if (isChinese) {
      duration = Math.max(1.5, charCount / charsPerSecond);
    } else {
      const wordCount = cleanSentence.split(/\s+/).length;
      duration = Math.max(1.5, wordCount / 3);
    }
    
    segments.push({
      start: currentTime,
      end: currentTime + duration,
      text: cleanSentence
    });
    
    currentTime += duration + pauseDuration;
  }
  
  return segments;
}

// Generate SRT format
function generateSRT(segments: Array<{start: number; end: number; text: string}>): string {
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

// Generate YouTube Chapters
function generateYouTubeChapters(segments: Array<{start: number; end: number; text: string}>): string {
  if (segments.length === 0) return '';
  
  // Take key segments for chapters (every ~3-5 segments)
  const totalChapters = Math.min(10, Math.max(2, Math.floor(segments.length / 3)));
  const chapterInterval = Math.max(2, Math.floor(segments.length / totalChapters));
  
  const chapters: Array<{time: number; text: string}> = [];
  
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
  
  // Always include the first and last
  if (chapters.length > 0 && chapters[0].time > 1) {
    const firstSeg = segments[0];
    chapters.unshift({
      time: firstSeg.start,
      text: firstSeg.text.slice(0, 25) + (firstSeg.text.length > 25 ? '...' : '')
    });
  }
  
  return chapters.map(ch => `${formatTimeForChapters(ch.time)} ${ch.text}`).join('\n');
}

// Format time for YouTube Chapters (MM:SS)
function formatTimeForChapters(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

// Translate segments (mock - replace with actual translation service)
async function translateSegments(
  segments: Array<{start: number; end: number; text: string}>,
  targetLanguage: string
): Promise<Array<{start: number; end: number; text: string}>> {
  if (!targetLanguage || targetLanguage === 'None' || targetLanguage === 'Original') {
    return segments;
  }
  
  const languageMap: Record<string, string> = {
    'English': '[EN] ',
    'Traditional Chinese': '[繁] ',
    'Simplified Chinese': '[简] ',
  };
  
  const prefix = languageMap[targetLanguage] || '';
  
  return segments.map(seg => ({
    ...seg,
    text: prefix + seg.text
  }));
}

export async function POST(req: Request) {
  try {
    const { script, language = 'Cantonese', targetLanguage, totalDuration } = await req.json();

    console.log('========== SUBTITLE GENERATION ==========');
    console.log('Script length:', script?.length || 0);
    console.log('Language:', language);
    console.log('Total duration received:', totalDuration);

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    // Clean the script
    const cleanScript = cleanTextForSubtitles(script);
    
    // Generate segments - use actual duration if available
    let segments;
    if (totalDuration && totalDuration > 0) {
      console.log('Using actual audio duration:', totalDuration);
      segments = generateSegmentsWithDuration(cleanScript, totalDuration, language);
    } else {
      console.log('Using estimated duration (fallback)');
      const isChinese = /[\u4e00-\u9fff]/.test(cleanScript);
      const charsPerSecond = isChinese ? 4 : 3.5;
      segments = generateSegmentsFromText(cleanScript, charsPerSecond);
    }

    console.log('Generated segments:', segments.length);

    // Optional translation
    let finalSegments = segments;
    if (targetLanguage && targetLanguage !== 'None' && targetLanguage !== 'Original') {
      finalSegments = await translateSegments(segments, targetLanguage);
    }

    // Generate SRT and chapters
    const srtContent = generateSRT(finalSegments);
    const youtubeChapters = generateYouTubeChapters(finalSegments);

    // Calculate total duration
    const totalDurationActual = finalSegments.length > 0 ? finalSegments[finalSegments.length - 1].end : 0;
    const totalMinutes = Math.floor(totalDurationActual / 60);
    const totalSeconds = Math.floor(totalDurationActual % 60);

    console.log('Total duration:', totalDurationActual);
    console.log('========== SUBTITLE GENERATION COMPLETE ==========');

    return NextResponse.json({
      success: true,
      srt: srtContent,
      youtubeChapters: youtubeChapters,
      segments: finalSegments,
      metadata: {
        totalDuration: totalDurationActual,
        totalDurationFormatted: `${totalMinutes}:${String(totalSeconds).padStart(2, '0')}`,
        segmentCount: finalSegments.length,
        language: language,
        targetLanguage: targetLanguage || 'None',
        durationSource: totalDuration && totalDuration > 0 ? 'audio' : 'estimated'
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