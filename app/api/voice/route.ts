import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, voiceId } = await req.json();

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: text,
        // CRITICAL: Use multilingual_v2 for better Cantonese
        model_id: "eleven_multilingual_v2", 
        voice_settings: {
          stability: 0.4,       // Lower = more expressive/natural
          similarity_boost: 0.8, // Higher = keeps the "Mi-Go" character voice
          style: 0.2,           // Slight style boost for character flair
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ElevenLabs Error:", errorData);
      return NextResponse.json({ error: "Voice failed" }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Voice system busy" }, { status: 500 });
  }
}