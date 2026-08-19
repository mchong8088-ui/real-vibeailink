import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { 
      userId, 
      topic, 
      language, 
      template = 'standard',
      tone = 'Energetic',
      includeTiming = true // New: include timing suggestions
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Add timing instructions if requested
    if (includeTiming) {
      systemPrompt += ` For each section, include estimated duration in seconds in parentheses, e.g., "(0:05)" for 5 seconds.`;
    }

    const prompt = `Create a complete YouTube video package for: "${topic}".
    Provide:
    1. 3 Catchy Video Titles
    2. Video Description with Hashtags
    3. The Complete Script with timing suggestions`;

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

    if (!aiResponse.ok || !aiData.choices?.[0]?.message?.content) {
      console.error("OpenAI API error:", aiData);
      return NextResponse.json({ error: "Failed to generate script from AI" }, { status: 500 });
    }

    const scriptOutput = aiData.choices[0].message.content;

    // Calculate estimated speaking time (approx 150 words per minute)
    const wordCount = scriptOutput.split(/\s+/).length;
    const estimatedDurationSeconds = Math.round((wordCount / 150) * 60);
    const estimatedDurationMinutes = Math.floor(estimatedDurationSeconds / 60);
    const estimatedDurationRemainder = estimatedDurationSeconds % 60;
    const estimatedDuration = `${estimatedDurationMinutes}:${estimatedDurationRemainder.toString().padStart(2, '0')}`;

    // Extract script sections for better organization
    const sections = extractScriptSections(scriptOutput);

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
      sections: sections,
      estimatedDuration: estimatedDuration,
      estimatedDurationSeconds: estimatedDurationSeconds,
      wordCount: wordCount,
      creditsUsed: creditsToDeduct,
      remainingCredits: profile.credits - creditsToDeduct,
      // Include voice timing suggestions for synchronization
      timingSuggestions: {
        intro: Math.min(10, Math.round(estimatedDurationSeconds * 0.15)),
        main: Math.round(estimatedDurationSeconds * 0.7),
        outro: Math.min(10, Math.round(estimatedDurationSeconds * 0.15))
      }
    });

  } catch (error) {
    console.error("Script API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to extract sections from script
function extractScriptSections(script: string): { title: string; content: string; estimatedDuration?: number }[] {
  const sections: { title: string; content: string; estimatedDuration?: number }[] = [];
  
  // Try to split by common section markers
  const sectionMarkers = ['Title:', 'Description:', 'Script:', 'Intro:', 'Main:', 'Outro:', 'B-Roll:', 'Voiceover:'];
  
  let currentSection = 'Full Script';
  let currentContent = '';
  
  const lines = script.split('\n');
  for (const line of lines) {
    let isSectionMarker = false;
    for (const marker of sectionMarkers) {
      if (line.trim().startsWith(marker)) {
        if (currentContent.trim()) {
          sections.push({ title: currentSection, content: currentContent.trim() });
        }
        currentSection = line.trim();
        currentContent = '';
        isSectionMarker = true;
        break;
      }
    }
    if (!isSectionMarker) {
      currentContent += line + '\n';
    }
  }
  
  if (currentContent.trim()) {
    sections.push({ title: currentSection, content: currentContent.trim() });
  }
  
  if (sections.length === 0) {
    sections.push({ title: 'Full Script', content: script });
  }
  
  return sections;
}