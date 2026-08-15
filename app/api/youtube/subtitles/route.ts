import { NextResponse } from "next/server";
import { generateYouTubeChapters } from '@/lib/youtube/subtitles';
import { translateSRTSegments } from '@/lib/youtube/translation';

export async function POST(req: Request) {
  try {
    const { script, language = 'Cantonese', targetLanguage } = await req.json();

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    // Transcribe/Segment generation logic
    let segments = await transcribeAudioWithWhisper(script, language);

    // Optional Dual-Language Translation
    if (targetLanguage && targetLanguage !== language) {
      segments = await translateSRTSegments(segments, targetLanguage);
    }

    const srtContent = generateSRT(segments);
    const youtubeChapters = generateYouTubeChapters(segments);

    return NextResponse.json({
      success: true,
      srt: srtContent,
      youtubeChapters: youtubeChapters,
      segments: segments,
    });

  } catch (error) {
    console.error("Subtitles error:", error);
    return NextResponse.json({ error: "Failed to generate subtitles" }, { status: 500 });
  }
}

function generateSRT(segments: any[]): string {
  return segments.map((seg, i) => `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`).join('\n');
}

function formatTime(seconds: number): string {
  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

async function transcribeAudioWithWhisper(script: string, language: string) {
  const sentences = script.match(/[^.!?。！？，]+[.!?。！？，]*/g) || [script];
  let time = 0;
  return sentences.map(s => {
    const duration = Math.max(2, s.trim().length / 4);
    const seg = { start: time, end: time + duration, text: s.trim() };
    time += duration + 0.3;
    return seg;
  });
}