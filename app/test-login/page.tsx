'use client'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function TestLoginPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Login error:', error)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ padding: 40 }}>
      <h1>Test Login Page</h1>
      {user ? (
        <div>
          <p style={{ color: 'green' }}>✅ Logged in as: {user.email}</p>
          <button onClick={handleLogout} style={{ marginTop: 20, padding: 10, cursor: 'pointer' }}>Logout</button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'red' }}>❌ Not logged in</p>
          <button onClick={handleGoogleLogin} style={{ marginTop: 20, padding: 10, cursor: 'pointer' }}>Login with Google</button>
        </div>
      )}
    </div>
  )
}
