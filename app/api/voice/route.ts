export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, voiceId } = await req.json();

    // Safety check: if no voiceId is passed, use a default one
    const targetVoiceId = voiceId || 'n4xdXKggn5lFcXFYE4TA'; 

    // Look for both standard and NEXT_PUBLIC prefixes for Cloudflare compatibility
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

    // --- VOICE CHECK LOG START ---
    console.log(`\n--- [VOICE CHECK] ---`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Voice ID: ${targetVoiceId}`);
    console.log(`Text Preview: ${text.substring(0, 30)}...`);
    
    if (response.ok) {
      console.log(`✅ SUCCESS: Audio generated successfully.`);
    } else {
      console.log(`❌ VOICE FAILED: Check API key or Voice ID.`);
    }
    console.log(`----------------------\n`);
    // --- VOICE CHECK LOG END ---

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ElevenLabs API Response Error:", errorData);
      return NextResponse.json({ error: "Voice synthesis failed" }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache" 
      },
    });
  } catch (error) {
    console.error("Voice Route System Error:", error);
    return NextResponse.json({ error: "Voice system busy" }, { status: 500 });
  }
}