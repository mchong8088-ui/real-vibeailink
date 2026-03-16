"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, LogOut, Trash2, CheckCircle, ChevronDown, Volume2, VolumeX, Menu } from 'lucide-react';

// --- 1. DATA MODELS ---
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
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });

  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'camera' | 'deletion' | 'dashboard' | 'logoutConfirm' | 'disclaimer'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'uploadType' | 'captureConfirm'>('none');
  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- AUDIO LOGIC ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    if (savedUser) setUser(JSON.parse(savedUser));
    else setActiveModal('login');
    if (savedHosts) {
      const custom = JSON.parse(savedHosts);
      setSelectableHosts([...initialHosts, ...custom]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const unlockAudio = () => {
    initAudioContext();
    setIsMuted(!isMuted);
  };

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
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    const currentInput = text;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: currentInput, sender: 'user' }]);
    setText('');
    setIsTyping(true);
    initAudioContext();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' }]);
      await playVoice(data.reply);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const finalizeLogin = () => {
    initAudioContext();
    const newUser = { name: authForm.name, email: authForm.email };
    setUser(newUser);
    localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
    setActiveModal('none');
  };

  return (
    <main style={{ height: '100dvh', width: '100vw', background: '#1e1b4b', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @media (max-width: 768px) {
          .main-container { flex-direction: row !important; }
          .sidebar { width: 35% !important; padding: 10px !important; border-right: 1px solid rgba(255,255,255,0.1); }
          .chat-area { width: 65% !important; padding: 10px !important; padding-bottom: 120px !important; }
          .big-avatar { width: 100% !important; height: auto !important; border-radius: 12px !important; }
          .small-avatar { width: 32px !important; height: 32px !important; }
          .create-vibe-btn { font-size: 10px !important; padding: 6px !important; line-height: 1.2; width: 100% !important; }
          .input-footer { position: fixed !important; bottom: 20px !important; left: 0; right: 0; padding: 0 10px !important; z-index: 999; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '50px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>V</span></div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>VibeAiLink</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '4px', borderRadius: '6px', fontSize: '11px' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          <button onClick={() => setActiveModal(user ? 'dashboard' : 'login')} style={{ background: user ? 'transparent' : '#22c55e', color: 'white', border: user ? '1px solid white' : 'none', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' }}>
            {user ? <Menu size={14} /> : 'Login'}
          </button>
        </div>
      </header>

      <div className="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div className="sidebar" style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <button className="create-vibe-btn" onClick={() => setTempActiveModal('uploadType')} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            Add new Vibe
          </button>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectableHosts.map(h => (
              <img key={h.id} className="small-avatar" src={h.src} onClick={() => setActiveHost(h)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: activeHost.id === h.id ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <img className="big-avatar" src={activeHost.src} style={{ width: '100%', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.2)', objectFit: 'cover' }} />
            <button onClick={unlockAudio} style={{ position: 'absolute', bottom: '8px', right: '8px', background: isMuted ? '#ef4444' : '#22c55e', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="chat-area" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                background: m.sender === 'user' ? '#6366f1' : '#ffffff',
                color: m.sender === 'user' ? 'white' : '#1e293b',
                padding: '10px 14px',
                borderRadius: '15px',
                maxWidth: '95%',
                fontSize: '15px'
              }}>
                {m.text}
              </div>
            ))}
            {isTyping && <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* FOOTER INPUT */}
      <footer className="input-footer" style={{ padding: '15px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '30px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '500px' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', height: '40px', paddingLeft: '10px' }}
          />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18}/>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontWeight: '900', margin: 0 }}>Welcome!</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={() => setActiveModal('disclaimer')}>Start Vibe</button>
          </div>
        </div>
      )}

      {activeModal === 'disclaimer' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Terms</h2>
            <p style={{ fontSize: '12px', textAlign: 'center' }}>AI platform. Users are responsible for content.</p>
            <button style={primaryButtonStyle} onClick={finalizeLogin}>I Agree</button>
          </div>
        </div>
      )}

      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontWeight: '900', margin: 0 }}>Create Vibe</h2>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={16}/> Select Photo</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { setTempCapturedImage(URL.createObjectURL(f)); setTempActiveModal('captureConfirm'); }
            }} />
            <button onClick={() => setTempActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}

      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
            <input placeholder="Name..." style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, border: newAvatarGender === 'male' ? '2px solid #6366f1' : 'none' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, border: newAvatarGender === 'female' ? '2px solid #6366f1' : 'none' }}>Female</button>
            </div>
            <button style={primaryButtonStyle} onClick={() => {
              const h: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName, gender: newAvatarGender, canDelete: true };
              const updated = [...selectableHosts, h];
              setSelectableHosts(updated);
              localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
              setTempActiveModal('none'); setActiveHost(h);
            }}>Save Vibe</button>
          </div>
        </div>
      )}
    </main>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '20px', borderRadius: '25px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '10px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '10px', background: '#f8fafc', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' };