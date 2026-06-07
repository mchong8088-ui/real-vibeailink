// app/api/test-supabase/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase.auth.getSession()
  
  return NextResponse.json({ 
    url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    key_prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
    session: data?.session?.user?.email || null,
    error: error?.message || null
  })
}