import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Log everything for debugging
  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Search params:', Object.fromEntries(requestUrl.searchParams))
  console.log('Hash:', requestUrl.hash)
  
  // Try multiple ways to get the code
  let code = requestUrl.searchParams.get('code')
  
  // Check hash fragment (Safari/Chrome OAuth sometimes puts it here)
  if (!code && requestUrl.hash) {
    const hashParams = new URLSearchParams(requestUrl.hash.substring(1))
    code = hashParams.get('code')
    console.log('Found code in hash:', !!code)
  }
  
  // Also check for access_token in hash (alternative OAuth flow)
  let accessToken = null
  if (requestUrl.hash) {
    const hashParams = new URLSearchParams(requestUrl.hash.substring(1))
    accessToken = hashParams.get('access_token')
    console.log('Found access_token in hash:', !!accessToken)
  }
  
  const next = requestUrl.searchParams.get('next') ?? '/'
  
  console.log('Final code present:', !!code)
  console.log('Access token present:', !!accessToken)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Error exchanging code:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
    }
    
    console.log('✅ Session exchanged successfully for user:', data.user?.email)
  } else if (accessToken) {
    // Alternative: if we have access_token directly, set session
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { error, data } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: new URLSearchParams(requestUrl.hash.substring(1)).get('refresh_token') || '',
    })
    
    if (error) {
      console.error('❌ Error setting session:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
    }
    
    console.log('✅ Session set successfully for user:', data.user?.email)
  } else {
    console.log('⚠️ No code or access_token found in request')
    // Don't redirect, just return to home
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  // Successful login - redirect to home
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
