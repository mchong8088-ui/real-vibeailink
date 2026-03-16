"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Upload, Trash2, Volume2, VolumeX, Menu, RefreshCw } from 'lucide-react';

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
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });

  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'dashboard' | 'disclaimer' | 'deletion' | 'logoutConfirm'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'uploadType' | 'captureConfirm'>('none');
  const [targetDeleteHost, setTargetDeleteHost] = useState<Host | null>(null);
  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
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

  const requestDelete = (e: React.MouseEvent | React.TouchEvent, host: Host) => {
    e.stopPropagation();
    setTargetDeleteHost(host);
    setActiveModal('deletion');
  };

  const confirmDelete = () => {
    if (!targetDeleteHost) return;
    const updated = selectableHosts.filter(h => h.id !== targetDeleteHost.id);
    setSelectableHosts(updated);
    localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
    if (activeHost.id === targetDeleteHost.id) setActiveHost(initialHosts[0]);
    setActiveModal('none');
    setTargetDeleteHost(null);
  };

  const playVoice = async (replyText: string) => {
    if (isMuted) return;
    const gender = activeHost.gender || 'female';
    const voiceId = gender === 'male' ? 'cHDwXsKG0qHMNLIjOusN' : 'n4xdXKggn5lFcXFYE4TA';
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
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
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

  return (
    <main style={{ height: '100dvh', width: '100vw', background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @media (max-width: 768px) {
          .main-container { flex-direction: row !important; }
          .sidebar { width: 35% !important; border-right: 1px solid rgba(255,255,255,0.1); }
          .chat-area { width: 65% !important; padding-bottom: 120px !important; }
          .input-footer { position: fixed !important; bottom: 20px !important; left: 0; right: 0; z-index: 999; }
        }
      `}</style>

      <header style={{ height: '50px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
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
        <div className="sidebar" style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            Add new Vibe
          </button>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectableHosts.map(h => (
              <div key={h.id} style={{ position: 'relative' }}>
                <img src={h.src} onClick={() => setActiveHost(h)} onContextMenu={(e) => e.preventDefault()} style={{ width: '45px', height: '45px', borderRadius: '50%', border: activeHost.id === h.id ? '2px solid #ec4899' : '2px solid transparent', cursor: 'pointer', objectFit: 'cover' }} />
                {h.canDelete && <button onClick={(e) => requestDelete(e, h)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>}
              </div>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <img src={activeHost.src} style={{ width: '100%', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', objectFit: 'cover' }} />
            <button onClick={() => { initAudioContext(); setIsMuted(!isMuted); }} style={{ position: 'absolute', bottom: '12px', right: '12px', background: isMuted ? '#ef4444' : '#22c55e', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        <div className="chat-area" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#ffffff', color: m.sender === 'user' ? 'white' : '#1e293b', padding: '12px 16px', borderRadius: m.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', maxWidth: '85%', fontSize: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{m.text}</div>
            ))}
            {isTyping && <div style={{ color: '#ec4899', fontSize: '12px', fontWeight: 'bold' }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      <footer className="input-footer" style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '30px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '95%', maxWidth: '600px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} onFocus={initAudioContext} placeholder="Type your vibe..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', height: '44px', paddingLeft: '15px' }} />
          <button onClick={handleSend} style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: 'white', border: 'none', borderRadius: '50%', width: '42px', height: '42px' }}><Send size={20}/></button>
        </div>
      </footer>

      {/* DASHBOARD / MENU MODAL */}
      {activeModal === 'dashboard' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ margin: 0 }}>Menu</h2>
            <button style={primaryButtonStyle} onClick={() => { setMessages([]); setActiveModal('none'); }}><RefreshCw size={16}/> Clear Chat</button>
            <button style={{ ...primaryButtonStyle, background: '#ef4444' }} onClick={() => setActiveModal('logoutConfirm')}>Logout</button>
            <button style={{ ...primaryButtonStyle, background: '#94a3b8' }} onClick={() => setActiveModal('none')}>Close</button>
          </div>
        </div>
      )}

      {/* DELETION MODAL */}
      {activeModal === 'deletion' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <Trash2 size={40} color="#ef4444" />
            <h2 style={{ margin: 0 }}>Remove Vibe?</h2>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, background: '#ef4444' }} onClick={confirmDelete}>Delete</button>
              <button style={{ ...primaryButtonStyle, background: '#94a3b8' }} onClick={() => setActiveModal('none')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontWeight: '900' }}>Welcome</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={() => setActiveModal('disclaimer')}>Next</button>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>New Vibe</h2>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={18}/> Select Photo</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) { setTempCapturedImage(URL.createObjectURL(f)); setTempActiveModal('captureConfirm'); }
            }} />
            <button onClick={() => setTempActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CAPTURE CONFIRM */}
      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ec4899' }} />
            <input placeholder="Vibe Name" style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: newAvatarGender === 'male' ? '2px solid #6366f1' : '1px solid #ddd' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: newAvatarGender === 'female' ? '2px solid #ec4899' : '1px solid #ddd' }}>Female</button>
            </div>
            <button style={primaryButtonStyle} onClick={() => {
              const h: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName, gender: newAvatarGender, canDelete: true };
              const updated = [...selectableHosts, h];
              setSelectableHosts(updated);
              localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
              setTempActiveModal('none'); setActiveHost(h);
            }}>Save</button>
          </div>
        </div>
      )}
    </main>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '30px', borderRadius: '32px', width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '14px', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none' };
const primaryButtonStyle: React.CSSProperties = { background: 'linear-gradient(to right, #6366f1, #ec4899)', color: 'white', padding: '14px', width: '100%', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };