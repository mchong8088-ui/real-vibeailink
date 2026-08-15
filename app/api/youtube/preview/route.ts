import { NextResponse } from 'next/server';
import { generateVoice } from '@/lib/youtube/voice';

export async function POST(req: Request) {
  try {
    const { script, language = 'Cantonese', speed = 1.0 } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script snippet is required' }, { status: 400 });
    }

    // Take only the first 100 characters for a quick sample
    const sampleText = script.slice(0, 100);

    const audioBuffer = await generateVoice({
      script: sampleText,
      language,
      outputFormat: 'mp3',
      useGateway: false, // Default to local voice for instant preview
      speed
    });

    return new Response(new Uint8Array(audioBuffer), {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.length.toString(),
  },
});
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}