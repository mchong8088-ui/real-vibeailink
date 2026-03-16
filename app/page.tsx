"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Menu, Plus } from 'lucide-react';

// --- MODELS ---
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

export default function VibeAiApp() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // FIX: This ensures Cloudflare finds "authForm"
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'dashboard' | 'disclaimer'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'captureConfirm'>('none');
  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    if (savedUser) setUser(JSON.parse(savedUser));
    else setActiveModal('login');
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const playVoice = async (replyText: string) => {
    if (isMuted) return;
    const voiceId = activeHost.gender === 'male' ? 'cHDwXsKG0qHMNLIjOusN' : 'n4xdXKggn5lFcXFYE4TA';
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, voiceId }),
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      initAudioContext();
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    const userMsg = text; setText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1 + '', text: data.reply, sender: 'ai' }]);
      await playVoice(data.reply);
    } finally { setIsTyping(false); }
  };

  const finalizeLogin = () => {
    initAudioContext();
    const newUser = { name: authForm.name, email: authForm.email };
    setUser(newUser);
    localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
    setActiveModal('none');
  };

  return (
    <main style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1b4b', position: 'fixed', fontFamily: 'sans-serif' }}>
      <style>{`
        .wave-bar { width: 3px; height: 10px; background: #00f2fe; border-radius: 2px; }
        @keyframes wave { 0%, 100% { height: 10px; } 50% { height: 20px; } }
        .speaking .wave-bar { animation: wave 0.4s infinite ease-in-out; background: #ec4899; }
        
        @media (max-width: 768px) {
          .main-container { flex-direction: column !important; }
          .sidebar-panel { width: 100% !important; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px !important; }
          .vibe-row { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 10px !important; }
          .big-vibe-box { width: 75px !important; height: 75px !important; flex-shrink: 0; }
          .small-vibe { width: 35px !important; height: 35px !important; }
          .mobile-hide { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
        <span style={{ fontWeight: 'bold' }}>VibeAiLink</span>
        <button onClick={() => setActiveModal(user ? 'dashboard' : 'login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '15px', fontSize: '12px' }}>
          {user ? <Menu size={16}/> : 'Login'}
        </button>
      </header>

      <div className="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div className="sidebar-panel" style={{ width: '220px', padding: '20px', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* THE NEW HORIZONTAL ROW FOR MOBILE */}
          <div className="vibe-row">
            <button onClick={() => fileInputRef.current?.click()} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={20} />
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { setTempCapturedImage(URL.createObjectURL(f)); setTempActiveModal('captureConfirm'); }
            }} />
            
            <div style={{ display: 'flex', gap: '5px' }}>
              {selectableHosts.map(h => (
                <img key={h.id} className="small-vibe" src={h.src} onClick={() => setActiveHost(h)} style={{ width: '35px', height: '35px', borderRadius: '50%', border: activeHost.id === h.id ? '2px solid #4ade80' : '1px solid gray', cursor: 'pointer', objectFit: 'cover' }} />
              ))}
            </div>

            <div className="big-vibe-box" style={{ position: 'relative' }}>
              <img src={activeHost.src} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
              <button onClick={() => { initAudioContext(); setIsMuted(!isMuted); }} style={{ position: 'absolute', bottom: '4px', right: '4px', background: isMuted ? '#ef4444' : '#22c55e', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMuted ? <VolumeX size={12}/> : <Volume2 size={12}/>}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
            <p style={{ margin: 0 }}>Hello, I am {activeHost.label},</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>your AI Assistant</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }} className={isSpeaking ? 'speaking' : ''}>
            <div className="wave-bar"></div><div className="wave-bar" style={{animationDelay:'0.1s'}}></div><div className="wave-bar" style={{animationDelay:'0.2s'}}></div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '25px', overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#f1f5f9', color: m.sender === 'user' ? 'white' : 'black', padding: '10px 15px', borderRadius: '18px', maxWidth: '85%', fontSize: '15px' }}>{m.text}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      <footer style={{ padding: '10px 15px 25px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '30px', display: 'flex', padding: '5px 10px', width: '100%', maxWidth: '500px', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <button onClick={() => { initAudioContext(); setIsListening(!isListening); }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '35px', height: '35px' }}>
            <Mic size={18} color={isListening ? 'white' : '#6366f1'} />
          </button>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask me anything..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }} />
          <button onClick={handleSend} style={{ background: '#6366f1', border: 'none', borderRadius: '50%', width: '35px', height: '35px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18} />
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal === 'login' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ margin: 0, textAlign: 'center' }}>VibeAiLink</h2>
            <input placeholder="Name" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button onClick={() => setActiveModal('disclaimer')} style={{ background: '#6366f1', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      )}

      {activeModal === 'disclaimer' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Terms</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>By entering, you agree to our AI interaction terms and privacy policy.</p>
            <button onClick={finalizeLogin} style={{ background: '#6366f1', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>I Agree</button>
          </div>
        </div>
      )}

      {tempActiveModal === 'captureConfirm' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '25px', width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <img src={tempCapturedImage!} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }} />
            <input placeholder="Vibe Name..." style={{ padding: '10px', width: '100%', borderRadius: '10px', border: '1px solid #ddd' }} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: newAvatarGender === 'male' ? '#6366f1' : '#f1f5f9', color: newAvatarGender === 'male' ? 'white' : 'black', border: 'none' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: newAvatarGender === 'female' ? '#6366f1' : '#f1f5f9', color: newAvatarGender === 'female' ? 'white' : 'black', border: 'none' }}>Female</button>
            </div>
            <button style={{ background: '#22c55e', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', fontWeight: 'bold' }} onClick={() => {
              const h: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName || 'My Vibe', gender: newAvatarGender, canDelete: true };
              setSelectableHosts([...selectableHosts, h]);
              setTempActiveModal('none'); setActiveHost(h);
            }}>Save Vibe</button>
          </div>
        </div>
      )}
    </main>
  );
}