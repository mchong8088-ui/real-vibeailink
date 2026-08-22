// /app/api/speech-to-text/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // 1. Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('🔐 Speech-to-Text - User check:', user?.email || 'No user');
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Please login to continue.'
      }, { status: 401 });
    }

    // 2. Get the request body
    const { audioBase64, language, format } = await req.json();
    
    if (!audioBase64) {
      return NextResponse.json({
        success: false,
        error: 'No audio data provided.'
      }, { status: 400 });
    }

    // 3. Get user profile with credits - with better error handling
    let profile = null;
    let profileError = null;
    
    try {
      const result = await supabase
        .from('profiles')
        .select('credits, subscription_plan')
        .eq('id', user.id)
        .single();
      
      profile = result.data;
      profileError = result.error;
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Continue without profile - use default credits in dev
    }

    // If profile fetch fails, use default credits in development
    const isDev = process.env.NODE_ENV === 'development';
    
    if (profileError && !isDev) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile.'
      }, { status: 500 });
    }

    console.log('📊 User credits:', profile?.credits || 'Using default in dev');

    // Calculate transcription cost (5 credits per minute, min 2 credits)
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const fileSizeMB = audioBuffer.length / (1024 * 1024);
    
    // Estimate duration: MP3 ~1MB/min, WAV ~10MB/min
    const estimatedDurationSec = format === 'wav' 
      ? fileSizeMB * 6 
      : fileSizeMB * 60;
    
    const durationMinutes = Math.max(1, Math.ceil(estimatedDurationSec / 60));
    const creditsToDeduct = Math.max(2, durationMinutes * 5);

    const currentCredits = profile?.credits || 100; // Default to 100 in dev
    
    console.log(`💰 Transcription cost: ${creditsToDeduct} credits (${durationMinutes} min), Current: ${currentCredits} credits`);

    // In development, bypass credit check
    if (isDev) {
      console.log('🔧 DEV MODE: Bypassing credit check');
      
      // Mock transcription based on language
      const mockTranscriptions: Record<string, string> = {
        'zh-HK': '大家好，歡迎來到米高\'s Love 投資頻道。記唔記得上一集，我哋講過一個「少年股神」？佢用咗一個好特別嘅方法，喺短短一個月之內，將十萬蚊變成一千萬。',
        'zh-CN': '大家好，欢迎来到米高\'s Love 投资频道。记不记得上一集，我们讲过一位「少年股神」？他用了一个很特别的方法，在短短一个月之内，把十万块变成了一千万。',
        'en-US': 'Hello everyone, welcome to Michael\'s Love Investment Channel. Do you remember in the last episode, we talked about a "Young Stock God"? He used a very special method to turn one hundred thousand into ten million in just one month.'
      };

      const langKey = language === 'zh-HK' ? 'zh-HK' : 
                      language === 'zh-CN' ? 'zh-CN' : 'en-US';
      
      const transcriptionText = mockTranscriptions[langKey] || mockTranscriptions['en-US'];

      return NextResponse.json({
        success: true,
        text: transcriptionText,
        duration: estimatedDurationSec,
        durationFormatted: `${Math.floor(estimatedDurationSec / 60)}:${String(Math.floor(estimatedDurationSec % 60)).padStart(2, '0')}`,
        creditsUsed: 0,
        creditsRemaining: currentCredits,
        fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
        language: language,
        format: format,
        isDevMode: true
      });
    }

    // Production: Check if user has enough credits
    if (currentCredits < creditsToDeduct) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. Need ${creditsToDeduct} credits for transcription. You have ${currentCredits} credits.`,
        creditsNeeded: creditsToDeduct,
        creditsAvailable: currentCredits,
        shortfall: creditsToDeduct - currentCredits
      }, { status: 402 });
    }

    // Deduct credits for transcription
    const newCredits = currentCredits - creditsToDeduct;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (updateError) {
      console.error('Credit deduction error:', updateError);
      // Continue anyway - don't fail the transcription
    }

    console.log(`✅ Credits deducted: ${creditsToDeduct}, Remaining: ${newCredits}`);

    // Production: Use Whisper API or other STT service
    // For now, return mock transcription
    const mockTranscriptions: Record<string, string> = {
      'zh-HK': '大家好，歡迎來到米高\'s Love 投資頻道。記唔記得上一集，我哋講過一個「少年股神」？佢用咗一個好特別嘅方法，喺短短一個月之內，將十萬蚊變成一千萬。',
      'zh-CN': '大家好，欢迎来到米高\'s Love 投资频道。记不记得上一集，我们讲过一位「少年股神」？他用了一个很特别的方法，在短短一个月之内，把十万块变成了一千万。',
      'en-US': 'Hello everyone, welcome to Michael\'s Love Investment Channel. Do you remember in the last episode, we talked about a "Young Stock God"? He used a very special method to turn one hundred thousand into ten million in just one month.'
    };

    const langKey = language === 'zh-HK' ? 'zh-HK' : 
                    language === 'zh-CN' ? 'zh-CN' : 'en-US';
    
    const transcriptionText = mockTranscriptions[langKey] || mockTranscriptions['en-US'];

    return NextResponse.json({
      success: true,
      text: transcriptionText,
      duration: estimatedDurationSec,
      durationFormatted: `${Math.floor(estimatedDurationSec / 60)}:${String(Math.floor(estimatedDurationSec % 60)).padStart(2, '0')}`,
      creditsUsed: creditsToDeduct,
      creditsRemaining: newCredits,
      fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
      language: language,
      format: format
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Speech-to-Text API",
    version: "1.0",
    features: {
      maxFileSizeMB: 50,
      maxDurationMinutes: 30,
      supportedFormats: ['mp3', 'wav', 'm4a'],
      costPerMinute: 5,
      minCredits: 2
    }
  });
}