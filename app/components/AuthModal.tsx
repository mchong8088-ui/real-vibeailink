import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authContent } from '../constants/content';

export const AuthModal = ({ isOpen, onClose, onGoogleSignIn }: any) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: '30px', width: '350px', borderRadius: '16px', textAlign: 'center' }}>
        <button onClick={onClose} style={{ float: 'right' }}><X /></button>
        <h2 style={{ marginBottom: '20px' }}>Welcome Back</h2>
        
        {/* Google 登入按鈕 */}
        <button 
          onClick={onGoogleSignIn}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#fff', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer' 
          }}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" />
          Sign in with Google
        </button>

        <div style={{ margin: '20px 0', color: '#666' }}>or</div>
        
        {/* Email/Password Fields ... */}
      </div>
    </div>
  );
};