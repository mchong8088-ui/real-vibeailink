"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, LogOut, Trash2, CheckCircle, ChevronDown, User, CreditCard } from 'lucide-react';

// ... (Host and Message interfaces remain the same) ...

export default function VibeAiApp() {
  // --- States ---
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0); 
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'logoutConfirm'>('none');
  
  // (Other existing refs for audio/video/typing...)

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setActiveModal('login');
    }
    // ... load trial counts and hosts ...
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vibe_user_v3');
    setUser(null);
    setIsDashboardOpen(false);
    setActiveModal('login');
  };

  return (
    // MAIN CONTAINER: Fixed to 100% of the screen height to prevent cutting off buttons
    <div style={{ height: '100vh', width: '100vw', background: '#1e1b4b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER: Fixed Height (80px) */}
      <header style={{ height: '80px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '35px', height: '35px', background: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>V</div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>VibeAiLink</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '12px', color: '#4ade80' }}>Welcome, {user.name}</span>
                <ChevronDown size={14} style={{ transform: isDashboardOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              {/* DASHBOARD: Floating on top so it doesn't push the screen down */}
              {isDashboardOpen && (
                <div style={{ position: 'absolute', top: '45px', right: 0, width: '220px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 1000, overflow: 'hidden' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #eee', background: '#f8fafc' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Account: {user.email}</div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Trial: {9 - msgCount} messages left</div>
                  </div>
                  
                  <button style={menuItemStyle}><User size={14}/> Profile</button>
                  <button style={menuItemStyle}><CreditCard size={14}/> Billing</button>
                  
                  <div style={{ height: '1px', background: '#eee' }}></div>
                  
                  {/* CLOSE BUTTON: Just closes the menu, keeps user logged in */}
                  <button onClick={() => setIsDashboardOpen(false)} style={menuItemStyle}>
                    <X size={14}/> Close Menu
                  </button>
                  
                  {/* LOGOUT: Now triggers a confirmation layer */}
                  <button onClick={() => setActiveModal('logoutConfirm')} style={{ ...menuItemStyle, color: '#ef4444' }}>
                    <LogOut size={14}/> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </header>

      {/* CONTENT AREA: flex-1 ensures it takes all remaining space without scrolling */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '15px', gap: '15px' }}>
        
        {/* LEFT SIDEBAR: Avatar & Creation */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ CREATE NEW VIBE</button>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Host Icons... */}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', overflow: 'hidden' }}>
            <img src="/avatars/nyman.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '20px', overflowY: 'auto', padding: '20px' }}>
            {/* Messages... */}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="Type your message..." style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none' }} />
            <button style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px', borderRadius: '12px' }}><Send size={20}/></button>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION LAYER */}
      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: 0 }}>Confirm Logout</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Are you sure you want to sign out? You will need to enter your email again to return.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleLogout} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Log Out</button>
              <button onClick={() => setActiveModal('none')} style={{ flex: 1, background: '#eee', color: '#333', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* (Keep your existing Login Modal here...) */}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '12px 15px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '15px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' };