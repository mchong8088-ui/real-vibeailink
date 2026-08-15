import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { 
      userId, 
      topic, 
      language, 
      template = 'standard', // 'standard' | 'hook' | 'broll' | 'shorts'
      tone = 'Energetic'
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits, subscription_plan')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const isSubscriber = profile.subscription_plan && profile.subscription_plan !== 'Free Explorer';
    if (!isSubscriber && profile.credits < 300) {
      return NextResponse.json({
        error: "This feature requires a subscription or at least 300 credits.",
        requiresUpgrade: true
      }, { status: 403 });
    }

    // Construct tailored prompts based on requested template
    let systemPrompt = `You are an expert YouTube Script Creator writing in ${language} with a ${tone} tone.`;
    
    if (template === 'broll') {
      systemPrompt += ` Format the response with clear markers: [Visual/B-Roll] and [Voiceover].`;
    } else if (template === 'shorts') {
      systemPrompt += ` Keep the script under 60 seconds (150 words total) focused on high retention.`;
    } else if (template === 'hook') {
      systemPrompt += ` Focus heavily on the first 15 seconds to maximize viewer retention.`;
    }

    const prompt = `Create a complete YouTube video package for: "${topic}".
    Provide:
    1. 3 Catchy Video Titles
    2. Video Description with Hashtags
    3. The Complete Script`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const scriptOutput = aiData.choices[0].message.content;

    // Credit calculation
    const charCount = scriptOutput.length;
    let creditsToDeduct = charCount < 500 ? 2 : (charCount > 2000 ? 10 : 5);

    await supabase
      .from('profiles')
      .update({ credits: profile.credits - creditsToDeduct })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      script: scriptOutput,
      creditsUsed: creditsToDeduct,
      remainingCredits: profile.credits - creditsToDeduct,
    });

  } catch (error) {
    console.error("Script API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}