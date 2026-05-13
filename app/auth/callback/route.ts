// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Create a supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // Redirect back to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}