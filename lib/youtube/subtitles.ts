export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

// Generates "00:00 - Intro" timestamp blocks for YouTube descriptions
export function generateYouTubeChapters(segments: SubtitleSegment[]): string {
  if (!segments || segments.length === 0) return '';

  let chapterText = '00:00 - Intro\n';
  let lastTimestamp = 0;
  
  // Create a chapter marker every ~60 seconds at natural sentence ends
  for (const seg of segments) {
    if (seg.start - lastTimestamp >= 60) {
      const minutes = Math.floor(seg.start / 60);
      const seconds = Math.floor(seg.start % 60);
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      chapterText += `${formattedTime} - ${seg.text.slice(0, 30)}...\n`;
      lastTimestamp = seg.start;
    }
  }

  return chapterText;
}