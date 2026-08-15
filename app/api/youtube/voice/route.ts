import { NextResponse } from "next/server";
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// Updated voice mapping: Cantonese set to 'Danny', Taiwanese set to 'Mei-Jia'
const voiceMap: Record<string, string> = {
  'Cantonese': 'Danny',
  'Mandarin': 'Ting-Ting',
  'Taiwanese': 'Mei-Jia',
  'English': 'Samantha',
  'Default': 'Alex'
};

// Force dynamic rendering to prevent build-time pre-rendering issues
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId, script, language = 'Cantonese', useGateway = false } = await req.json();

    if (!userId || !script) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in env.");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch user profile and check subscription/credits
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits, subscription_plan')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const isSubscriber = profile.subscription_plan && profile.subscription_plan !== 'Free Explorer';
    const hasEnoughCredits = profile.credits >= 300;

    // Strict Access Guard for Voice Provider feature
    if (!isSubscriber && !hasEnoughCredits) {
      return NextResponse.json({
        error: "This feature is only available for monthly/annual subscribers or users with 300+ credits.",
        requiresUpgrade: true
      }, { status: 403 });
    }

    // 2. Dynamic credit schedule: 2 credits per 500 chars (Local), doubled for Gateway
    const charCount = script.length;
    let baseCredits = 2;
    if (charCount > 500 && charCount <= 2000) {
      baseCredits = 5;
    } else if (charCount > 2000) {
      baseCredits = 10;
    }

    const creditsToDeduct = useGateway ? baseCredits * 2 : baseCredits;

    if (profile.credits < creditsToDeduct) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${creditsToDeduct} credits, but you have ${profile.credits}.`,
        requiredCredits: creditsToDeduct,
        currentCredits: profile.credits,
      }, { status: 403 });
    }

    // 3. Audio generation logic
    let audioBuffer: Buffer;

    if (useGateway) {
      audioBuffer = await generateGatewayVoice(script, language);
    } else {
      try {
        audioBuffer = await generateLocalMacVoice(script, language);
      } catch (localErr) {
        console.warn("Local macOS TTS failed. Falling back to Gateway TTS:", localErr);
        audioBuffer = await generateGatewayVoice(script, language);
      }
    }

    // 4. Deduct credits upon successful generation
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - creditsToDeduct })
      .eq('id', userId);

    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      creditsUsed: creditsToDeduct,
      remainingCredits: profile.credits - creditsToDeduct,
      format: 'mp3',
    });

  } catch (error) {
    console.error("Voice generation error:", error);
    return NextResponse.json({ error: "Voice generation failed" }, { status: 500 });
  }
}

// Generate local voice via macOS CLI 'say' command using file input
async function generateLocalMacVoice(script: string, language: string): Promise<Buffer> {
  const tempId = randomUUID();
  const tempDir = '/tmp';
  const txtPath = join(tempDir, `${tempId}.txt`);
  const aiffPath = join(tempDir, `${tempId}.aiff`);
  const mp3Path = join(tempDir, `${tempId}.mp3`);

  const voice = voiceMap[language] || voiceMap.Default;

  try {
    // Write text to file to avoid shell escaping issues with long multi-line scripts
    await writeFile(txtPath, script, 'utf-8');

    // Run macOS say command reading from input file (-f)
    await execAsync(`say -v "${voice}" -f "${txtPath}" -o "${aiffPath}"`);

    // Convert AIFF to MP3 via ffmpeg
    await execAsync(`ffmpeg -i "${aiffPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}" -y`);

    const buffer = await readFile(mp3Path);
    return buffer;

  } finally {
    // Clean up temporary files
    await Promise.all([
      unlink(txtPath).catch(() => {}),
      unlink(aiffPath).catch(() => {}),
      unlink(mp3Path).catch(() => {})
    ]);
  }
}

// Gateway voice generation using OpenAI TTS
async function generateGatewayVoice(script: string, language: string): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: language === 'Cantonese' ? 'onyx' : 'alloy',
      input: script,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS API request failed: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}