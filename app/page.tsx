"use client";

import React, { useState, useEffect } from 'react';
import { Send, X, LogOut, ChevronDown, User, CreditCard, Mic } from 'lucide-react';

export default function VibeAiApp() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vibe_user_v3');
    window.location.reload(); // Simple, clean reset to login
  };

  return (
    // Reverting to the original flexbox structure that kept everything in proportion
    <div style={{ height: '100vh', width: '100vw', background: '#1e1b4b', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', background: 'rgba(30, 27, 75, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', background: '#6366f1', borderRadius: '6px' }} />
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>VibeAiLink</span>
        </div>

        {user && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Welcome, {user.name}</span>
              <ChevronDown size={16} />
            </button>

            {/* DASHBOARD OVERLAY: Added the requested 'Close' and Confirmation logic */}
            {isDashboardOpen && (
              <div style={{ position: 'absolute', top: '50px', right: 0, width: '240px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', background: '#f8fafc' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                  <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 'bold' }}>Trial: {10 - msgCount}/10 left</div>
                </div>
                
                <button style={menuItemStyle}><User size={16}/> Profile</button>
                <button style={menuItemStyle}><CreditCard size={16}/> Billing</button>
                
                <div style={{ height: '1px', background: '#eee' }} />

                {/* NEW: Close selection to remain logged in */}
                <button onClick={() => setIsDashboardOpen(false)} style={menuItemStyle}>
                  <X size={16}/> Close Menu
                </button>

                {/* NEW: Trigger confirmation instead of immediate logout */}
                <button onClick={() => setShowLogoutConfirm(true)} style={{ ...menuItemStyle, color: '#ef4444' }}>
                  <LogOut size={16}/> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* MAIN CONTENT: Restored to the previous side-by-side layout */}
      <div style={{ flex: 1, display: 'flex', padding: '20px', gap: '20px', overflow: 'hidden' }}>
        
        {/* LEFT PANEL: Avatar & Create Button */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button style={{ background: '#22c55e', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            + CREATE NEW VIBE
          </button>
          
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="/avatars/michael.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
          </div>
        </div>

        {/* RIGHT PANEL: Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {/* Messages would map here */}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center' }}>
              <input placeholder="Type your message..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none' }} />
            </div>
            <button style={{ background: '#6366f1', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION OVERLAY */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Confirm Logout</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Are you sure you want to exit? You will need to sign in again to continue.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleLogout} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
              <button onClick={() => { setShowLogoutConfirm(false); setIsDashboardOpen(false); }} style={{ flex: 1, background: '#f1f5f9', color: '#333', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '12px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#333' };