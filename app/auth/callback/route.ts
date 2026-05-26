import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('🔵 Auth callback started')
  console.log('📝 Code present:', !!code)
  console.log('🔗 Origin:', requestUrl.origin)

  if (code) {
    const cookieStore = await cookies()
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )
    
    // Exchange the code for a session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Exchange error:', error.message)
      return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(error.message), requestUrl.origin))
    }
    
    console.log('✅ Session exchanged successfully')
    console.log('👤 User email:', data.user?.email)
    
    // Successful login - redirect to home
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided
  console.log('❌ No code provided in callback')
  return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin))
}
