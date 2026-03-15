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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  
  // User & Dashboard States
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0); 
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'camera' | 'naming' | 'gender' | 'deletion'>('none');
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
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    const savedCount = localStorage.getItem('vibe_trial_count');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setActiveModal('login');
    }

    if (savedCount) setMsgCount(parseInt(savedCount));

    if (savedHosts) {
        const custom = JSON.parse(savedHosts);
        setSelectableHosts([...initialHosts, ...custom]);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!user && msgCount >= 10) {
      setActiveModal('login');
      return;
    }
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user' }]);
    const currentInput = text; setText(''); 
    setIsTyping(true);
    if (!user) {
      const newCount = msgCount + 1;
      setMsgCount(newCount);
      localStorage.setItem('vibe_trial_count', newCount.toString());
    }
    // Simulation logic for progress bar
    setProgress(10);
    const progressInterval = setInterval(() => { setProgress(prev => (prev < 90 ? prev + 1 : prev)); }, 400);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' }]);
      setProgress(100);
    } catch (err) { console.error(err); } finally {
      clearInterval(progressInterval);
      setTimeout(() => { setIsTyping(false); setProgress(0); }, 500);
    }
  };

  const handleLogin = () => {
    if (authForm.name && authForm.email) {
      const newUser = { name: authForm.name, email: authForm.email };
      setUser(newUser);
      localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
      setActiveModal('none');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vibe_user_v3');
    setUser(null);
    setIsDashboardOpen(false);
    setActiveModal('login');
  };

  const finalizeAvatarCreation = () => {
    const newHost: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName, gender: newAvatarGender, canDelete: true };
    const updated = [...selectableHosts, newHost];
    setSelectableHosts(updated);
    localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(h => h.canDelete)));
    setTempActiveModal('none');
    setActiveHost(newHost);
  };

  return (
    <main style={{ height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <header style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>V</div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>VibeAiLink</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px', borderRadius: '8px' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#4ade80' }}>Welcome, {user.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>Trial: {10 - msgCount} left</div>
                </div>
                <ChevronDown size={14} style={{ transform: isDashboardOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              {/* DASHBOARD DROPDOWN */}
              {isDashboardOpen && (
                <div style={{ position: 'absolute', top: '50px', right: 0, width: '200px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 200 }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontSize: '10px', color: '#888' }}>Account</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  </div>
                  <button style={menuItemStyle}><User size={14}/> Profile</button>
                  <button style={menuItemStyle}><CreditCard size={14}/> Billing</button>
                  <div style={{ height: '1px', background: '#eee' }}></div>
                  <button onClick={handleLogout} style={{ ...menuItemStyle, color: '#ef4444' }}><LogOut size={14}/> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer' }}>+ CREATE NEW VIBE</button>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {selectableHosts.map(h => (
              <img key={h.id} src={h.src} onClick={() => setActiveHost(h)} style={{ width: '60px', height: '60px', borderRadius: '50%', border: activeHost.id === h.id ? '3px solid #4ade80' : '2px solid transparent', cursor: 'pointer', objectFit: 'cover' }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={activeHost.src} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isTyping && <div style={{ height: '4px', width: '100%', background: '#eee' }}><div style={{ height: '100%', background: '#6366f1', width: `${progress}%`, transition: 'width 0.3s' }}></div></div>}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#f1f5f9', color: m.sender === 'user' ? 'white' : '#333', padding: '12px 18px', borderRadius: '15px', maxWidth: '80%' }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type your message..." style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', fontSize: '16px' }} />
            <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', width: '50px', borderRadius: '12px', cursor: 'pointer' }}><Send size={20}/></button>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ alignSelf: 'flex-end', cursor: 'pointer' }} onClick={() => setActiveModal('none')}><X size={20}/></div>
            <h2 style={{ marginBottom: '10px' }}>Welcome back</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button onClick={handleLogin} style={{ background: '#22c55e', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          </div>
        </div>
      )}

      {/* ADDITIONAL MODALS (Simplified for this block) */}
      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
             <button onClick={() => fileInputRef.current?.click()} style={inputStyle}>Upload File</button>
             <button onClick={() => setTempActiveModal('none')} style={{ color: '#888', background: 'none', border: 'none' }}>Cancel</button>
             <input type="file" ref={fileInputRef} hidden onChange={(e) => { 
               const file = e.target.files?.[0]; 
               if(file) { setTempCapturedImage(URL.createObjectURL(file)); setTempActiveModal('captureConfirm'); } 
             }} />
          </div>
        </div>
      )}
      
      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <input placeholder="Avatar Name" style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <button onClick={finalizeAvatarCreation} style={{ background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', width: '100%' }}>Create Vibe</button>
          </div>
        </div>
      )}

    </main>
  );
}

const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '10px 15px', textAlign: 'left', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#444' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '30px', borderRadius: '20px', width: '350px', display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' };