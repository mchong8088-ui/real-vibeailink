"use client";
import React, { useState, useEffect } from 'react';
import { supabase, signInWithGoogle } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state change:', event);
      if (event === 'SIGNED_IN' && session) {
        onClose();
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    });

    return () => subscription.unsubscribe();
  }, [onClose, onSuccess]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } }
    });
    
    if (error) {
      setError(error.message);
    } else {
      setError('Check your email for confirmation link!');
    }
    setLoading(false);
  };

  // In AuthModal.tsx, update the Google sign-in
const handleGoogleLogin = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (err: any) {
    setError(err.message)
    setLoading(false)
  }
};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '24px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '16px', color: '#9CA3AF', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '20px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          <form onSubmit={isLogin ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isLogin && (
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name (optional)" style={{ width: '100%', padding: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: 'none', outline: 'none' }} />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: 'none', outline: 'none' }} required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px', fontSize: '14px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: 'none', outline: 'none' }} required />
            {error && <div style={{ color: '#EF4444', fontSize: '12px', textAlign: 'center', backgroundColor: '#FEF2F2', padding: '8px', borderRadius: '12px' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#FEF08A', color: '#111827', fontWeight: '600', padding: '12px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.6 : 1 }}>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
          </form>
          
          <div style={{ position: 'relative', margin: '16px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', borderTop: '1px solid #E5E7EB' }}></div></div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '12px' }}><span style={{ padding: '0 8px', backgroundColor: 'white', color: '#9CA3AF' }}>or</span></div>
          </div>
          
          <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '10px', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span style={{ fontSize: '14px', color: '#374151' }}>Sign in with Google</span>
          </button>
          
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', backgroundColor: 'transparent', color: '#2563EB', fontWeight: '500', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
