"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, LogOut, Trash2, CheckCircle, ChevronDown, User, CreditCard } from 'lucide-react';

// --- DATA MODELS ---
interface Host {
  id: string;
  src: string;
  label: string;
  gender: 'male' | 'female';
  canDelete?: boolean; 
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const initialHosts: Host[] = [
  { id: 'nyc', src: '/avatars/nyman.jpg', label: 'Michael 米哥', gender: 'male', canDelete: false },
  { id: 'kr', src: '/avatars/hkgirl.jpg', label: 'Teresa 麗莎', gender: 'female', canDelete: false },
  { id: 'tw', src: '/avatars/twgirl.jpg', label: 'Sophia 蘇菲亞', gender: 'female', canDelete: false }
];

const metroDialects = [
  { code: 'zh-HK', label: 'Cantonese (廣東話)' },
  { code: 'zh-CN', label: 'Mandarin (普通話)' },
  { code: 'en-US', label: 'English (US)' }
];

export default function VibeAiApp() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0); 
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
  // Modals logic
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'camera' | 'deletion' | 'dashboard' | 'logoutConfirm'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'uploadType' | 'captureConfirm'>('none');

  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');
  const [hostToDelete, setHostToDelete] = useState<Host | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    const savedCount = localStorage.getItem('vibe_trial_count');
    if (savedUser) setUser(JSON.parse(savedUser));
    else setActiveModal('login');
    if (savedCount) setMsgCount(parseInt(savedCount));
    if (savedHosts) {
        const custom = JSON.parse(savedHosts);
        setSelectableHosts([...initialHosts, ...custom]);
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const handleSend = async () => {
    if (!user && msgCount >= 10) { setActiveModal('login'); return; }
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user' }]);
    const currentInput = text; setText(''); 
    setIsTyping(true);
    if (!user) {
      const newCount = msgCount + 1;
      setMsgCount(newCount);
      localStorage.setItem('vibe_trial_count', newCount.toString());
    }
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' }]);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const handleLogin = () => {
    if (authForm.name && authForm.email) {
      const newUser = { name: authForm.name, email: authForm.email };
      setUser(newUser);
      localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
      setActiveModal('none');
    }
  };

  const finalizeAvatarCreation = () => {
    const newHost: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName, gender: newAvatarGender, canDelete: true };
    const updated = [...selectableHosts, newHost];
    setSelectableHosts(updated);
    localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(h => h.canDelete)));
    setTempCapturedImage(null); setNewAvatarName(''); setTempActiveModal('none'); setActiveHost(newHost); 
  };

  return (
    <main style={{ height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <header style={{ height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>V</span>
          </div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '22px' }}>VibeAiLink</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user ? (
            <button 
              onClick={() => setActiveModal('dashboard')}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              Welcome, {user.name}
              <ChevronDown size={14} />
            </button>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR - Smaller Avatar Version */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '15px', background: 'rgba(0,0,0,0.15)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>+ CREATE VIBE</button>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
            {selectableHosts.map(h => (
              <img key={h.id} src={h.src} onClick={() => setActiveHost(h)} style={{ width: '50px', height: '50px', borderRadius: '50%', border: activeHost.id === h.id ? '3px solid #4ade80' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
            ))}
          </div>

          {/* Avatar Container: Reduced in size to give Chat more room */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '240px' }}>
              <img src={activeHost.src} style={{ width: '100%', borderRadius: '25px', border: '5px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              <div style={{ textAlign: 'center', color: 'white', marginTop: '10px', fontWeight: 'bold' }}>{activeHost.label}</div>
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '30px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ height: '50px', background: '#f8fafc', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
              <span style={{ fontWeight: 'bold' }}>{isTyping ? "Thinking..." : "Connected"}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#f1f5f9', color: m.sender === 'user' ? 'white' : 'black', padding: '12px 18px', borderRadius: '18px', margin: '5px 0', maxWidth: '80%' }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: '0 20px 20px' }}>
        <div style={{ background: 'white', borderRadius: '50px', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type message..." style={{ flex: 1, border: 'none', outline: 'none', padding: '10px' }} />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer' }}><Send size={18}/></button>
        </div>
      </footer>

      {/* DASHBOARD MODAL */}
      {activeModal === 'dashboard' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Dashboard</h2>
              <X onClick={() => setActiveModal('none')} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ width: '100%', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px' }}>Email: <b>{user?.email}</b></p>
            </div>
            <button style={menuItemStyle}><User size={16}/> Profile</button>
            <button style={menuItemStyle}><CreditCard size={16}/> Plans</button>
            <div style={{ height: '1px', background: '#eee', width: '100%' }} />
            <button onClick={() => setActiveModal('logoutConfirm')} style={{ ...menuItemStyle, color: 'red' }}><LogOut size={16}/> Logout</button>
            <button onClick={() => setActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Close & Return</button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRM */}
      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Confirm Logout?</h3>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => { localStorage.removeItem('vibe_user_v3'); window.location.reload(); }} style={{ ...primaryButtonStyle, background: 'red', flex: 1 }}>Logout</button>
              <button onClick={() => setActiveModal('dashboard')} style={{ ...primaryButtonStyle, background: '#ccc', flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* (Other Modals: Camera, Upload, Login remain but styled within these bounds) */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>Welcome!</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={handleLogin}>Start</button>
          </div>
        </div>
      )}
    </main>
  );
}

// STYLES
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '25px', width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #ddd' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '10px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };