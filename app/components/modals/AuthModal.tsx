// components/modals/AuthModal.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  const [showTerms, setShowTerms] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
      onSuccess?.();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    
    if (error) {
      setError(error.message);
    } else if (data.user) {
      setTempUser(data.user);
      setShowTerms(true);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        padding: '20px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '16px', marginTop: '4px' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={isLogin ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Name field - optional */}
          <div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#F9FAFB',
                borderRadius: '14px',
                border: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          
          {/* Email field */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#F9FAFB',
                borderRadius: '14px',
                border: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>
          
          {/* Password field */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#F9FAFB',
                borderRadius: '14px',
                border: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: '#EF4444', fontSize: '12px', textAlign: 'center', backgroundColor: '#FEF2F2', padding: '8px', borderRadius: '12px' }}>
              {error}
            </div>
          )}
          
          {/* Submit Button - Light Yellow */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#FEF08A',
              color: '#111827',
              fontWeight: '600',
              padding: '10px',
              borderRadius: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
              marginTop: '4px',
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        {/* Divider */}
        <div style={{ position: 'relative', margin: '16px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid #E5E7EB' }}></div>
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '12px' }}>
            <span style={{ padding: '0 8px', backgroundColor: 'white', color: '#9CA3AF' }}>or</span>
          </div>
        </div>
        
        {/* Google Button - White background with small Google icon */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            padding: '10px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxSizing: 'border-box',
          }}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span style={{ fontSize: '14px', color: '#374151' }}>Sign in with Google</span>
        </button>
        
        {/* Toggle between Login and Sign Up */}
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#2563EB',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>

      {/* Terms Modal Popup */}
      {showTerms && tempUser && (
        <TermsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          user={tempUser}
          displayName={displayName}
          email={email}
          onAccept={() => {
            setShowTerms(false);
            onClose();
            onSuccess?.();
          }}
        />
      )}
    </div>
  );
};

// TermsModal component
const TermsModal: React.FC<any> = ({ isOpen, onClose, user, displayName, email, onAccept }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    setIsScrolledToBottom(isBottom);
  };

  const handleAccept = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || email.split('@')[0],
        email: email,
        has_accepted_legal: true,
        credits: 100,
        subscription_status: 'explorer',
        subscription_plan: 'Free Explorer',
      })
      .eq('id', user.id);
    
    if (!error) {
      onAccept();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-center">Terms of Service & Legal Agreement</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5" onScroll={handleScroll}>
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">1. Terms of Service</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Eligibility:</strong> For legal adults only (18+).</p>
              <p><strong>Service Nature:</strong> Market data summaries and AI analysis - NOT financial advice.</p>
              <p><strong>User Responsibility:</strong> All actions are independent decisions.</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">2. Disclaimer</h3>
            <div className="text-sm text-gray-700">
              <p>Data provided is based on 'Big Data Algorithms' and 'Mathematical Models' and does not constitute investment advice.</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-bold text-blue-600 mb-2">3. Privacy Policy</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Data Collection:</strong> Only necessary account information.</p>
              <p><strong>Payment Security:</strong> Securely processed by Stripe.</p>
              <p><strong>Data Retention:</strong> Deleted upon account deactivation.</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">🎁 Welcome Bonus!</p>
            <p className="text-xs text-yellow-700 mt-1">Accept to receive 100 FREE credits as an Explorer member!</p>
          </div>
        </div>
        
        <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!isScrolledToBottom || loading}
              className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${
                isScrolledToBottom && !loading
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'Accept & Get 100 Credits'}
            </button>
          </div>
          {!isScrolledToBottom && (
            <p className="text-xs text-gray-400 text-center mt-3">Please scroll to the bottom to accept</p>
          )}
        </div>
      </div>
    </div>
  );
};