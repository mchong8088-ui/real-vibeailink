export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, voiceId } = await req.json();

    // Default to the Female voice if none provided
    const targetVoiceId = voiceId || 'n4xdXKggn5lFcXFYE4TA'; 

    // Support both standard and Cloudflare environment variable formats
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("❌ Missing ElevenLabs API Key");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2", 
        voice_settings: {
          stability: 0.4,       
          similarity_boost: 0.8, 
          style: 0.2,           
          use_speaker_boost: true
        }
      }),
    });

    // Logging for your terminal (VS Code / Cloudflare Logs)
    console.log(`\n--- [VOICE CHECK] ---`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Voice ID: ${targetVoiceId}`);
    
    if (response.ok) {
      console.log(`✅ SUCCESS: Audio data received from ElevenLabs.`);
    } else {
      const errorText = await response.text();
      console.log(`❌ VOICE FAILED: ${errorText}`);
      return NextResponse.json({ error: "ElevenLabs rejected request" }, { status: response.status });
    }
    console.log(`----------------------\n`);

    // Convert the response to a Stream (Best for Edge Runtime)
    const audioData = await response.arrayBuffer();

    return new NextResponse(audioData, {
      headers: { 
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.byteLength.toString(),
        "Cache-Control": "no-cache" 
      },
    });

  } catch (error) {
    console.error("Voice Route System Error:", error);
    return NextResponse.json({ error: "Voice system busy" }, { status: 500 });
  }
}