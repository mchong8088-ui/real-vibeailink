'use client'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function TestSupabase() {
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function test() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setStatus(session ? '✅ Logged in' : '❌ Not logged in')
        setUser(session?.user?.email || null)
      } catch (err: any) {
        setStatus('❌ Connection failed')
        setError(err.message)
      }
    }
    test()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🔐 Supabase Auth Test</h1>
      <div style={{ margin: '20px 0', padding: 10, background: '#f0f0f0', borderRadius: 5 }}>
        <p><strong>Status:</strong> {status}</p>
        {user && <p><strong>User:</strong> {user}</p>}
        {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleLogin} style={{ padding: '10px 20px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          Login with Google
        </button>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  )
}
