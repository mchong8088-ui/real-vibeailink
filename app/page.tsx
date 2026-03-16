"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, LogOut, Trash2, ChevronDown, Volume2, VolumeX, Menu, Plus } from 'lucide-react';

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
  const [isMuted, setIsMuted] = useState(false); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'deletion' | 'dashboard' | 'logoutConfirm' | 'disclaimer'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'uploadType' | 'captureConfirm'>('none');

  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AUDIO PERSISTENCE & MOBILE UNLOCK ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    const keepAlive = setInterval(() => {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start(0);
        osc.stop(0.1);
      }
    }, 20000); 
    return () => clearInterval(keepAlive);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    if (savedUser) setUser(JSON.parse(savedUser));
    else setActiveModal('login');
    if (savedHosts) {
        const custom = JSON.parse(savedHosts);
        setSelectableHosts([...initialHosts, ...custom]);
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) { t += e.results[i][0].transcript; }
        setText(t);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const playVoice = async (replyText: string) => {
    // FIX 2: Check mute before calling API
    if (isMuted) { console.log("Sound muted."); return; }
    
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
      
      // Reinforce mobile playback
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      
      // FIX 1: Play sound
      audio.play().catch(e => console.error("Playback blocked by browser.", e));
    } catch (err) { console.error("Voice Error:", err); }
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
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' }]);
      await playVoice(data.reply);
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setTempCapturedImage(URL.createObjectURL(f)); setTempActiveModal('captureConfirm'); }
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
        /* FIX 2: The Sound Wave symbol */
        .wave-bar { width: 3px; height: 10px; background: #00f2fe; border-radius: 2px; box-shadow: 0 0 8px #00f2fe; }
        @keyframes wave { 0%, 100% { height: 10px; transform: scaleY(1); } 50% { height: 20px; transform: scaleY(1.3); } }
        .speaking .wave-bar { animation: wave 0.4s infinite ease-in-out; background: #ec4899; box-shadow: 0 0 8px #ec4899; }
        
        /* Requirement 1: Optimized Mobile Stacked Layout */
        @media (max-width: 768px) {
          .vibe-header { height: 45px !important; }
          .main-container { flex-direction: column !important; }
          .sidebar-panel { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1); height: auto !important; }
          .chat-area-main { padding-bottom: 100px !important; }
          .modal-content { width: 95% !important; max-height: 80vh !important; }
          
          /* The new horizontal "Vibe Row" */
          .vibe-row { display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; width: 100% !important; overflow-x: auto !important; }
          .big-vibe-box { width: 60px !important; height: 60px !important; flex-shrink: 0 !important; }
          .small-vibe { width: 30px !important; height: 30px !important; flex-shrink: 0 !important; }
          .mobile-hide { display: none !important; }
          .create-vibe-circle { width: 30px !important; height: 30px !important; border-radius: 50% !important; padding: 0 !important; font-size: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="vibe-header" style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>VibeAiLink</span>
        <div style={{ display: 'flex', gap: '8px', alignItems:'center' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '5px', borderRadius: '8px', fontSize: '11px' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          <button onClick={() => setActiveModal(user ? 'dashboard' : 'login')} style={{ background: user ? 'transparent' : '#22c55e', border: user ? '1px solid white' : 'none', color: 'white', padding: '6px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' }}>
            {user ? <Menu size={16} /> : 'Login'}
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }} className="md:flex-row flex-col">
        
        {/* Requirement 1: Control Panel */}
        <div className="sidebar-panel" style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
          
          {/* Requirement 1: Horizontal Vibe Row */}
          <div className="vibe-row" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Requirement 4: Upload Button Only (Simplified Logic) */}
              <button className="create-vibe-btn create-vibe-circle" onClick={() => fileInputRef.current?.click()} style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                <Plus size={16} className="md:hidden"/>
                <span className="mobile-hide">+ Create your own Vibe</span>
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />

              {/* Small Avatars */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {selectableHosts.map(h => (
                  <img key={h.id} className="small-vibe" src={h.src} onClick={() => setActiveHost(h)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: activeHost.id === h.id ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
                ))}
              </div>

              {/* Requirement 1: Shrunken Active Avatar */}
              <div className="big-vibe-box" style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '15px' }}>
                <img src={activeHost.src} style={{ width: '100%', height: '100%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                <button onClick={unlockAudio} style={{ position: 'absolute', bottom: '6px', right: '6px', background: isMuted ? '#ef4444' : '#22c55e', color: 'white', border: '2px solid #1e1b4b', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
          </div>
          
          {/* Requirement 3: Assistant Description */}
          <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>Hello, I am {activeHost.label},</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0, fontWeight: 'bold' }}>your AI Assistant</p>
          </div>

          {/* FIX 2: Place Sound Wave symbol below the shrunken avatar description */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', padding: '5px' }} className={isSpeaking ? 'speaking mobile-hide' : 'mobile-hide'}>
              <div className="wave-bar"></div><div className="wave-bar" style={{animationDelay: '0.1s'}}></div><div className="wave-bar" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* CHAT AREA: CENTRALLY ALLOCATED */}
        <div className="chat-area-main" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '25px', overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '750px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#f1f5f9', color: m.sender === 'user' ? 'white' : '#1e293b', padding: '8px 14px', borderRadius: '15px', maxWidth: '85%', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {isTyping && <div style={{ padding: '8px 15px', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Thinking...</div>}
          </div>
        </div>
      </div>

      {/* Requirement 1 & 2: INPUT FOOTER (Center Bottom) */}
      <footer className="input-footer" style={{ padding: '10px 15px 30px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '50px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <button onClick={() => { initAudioContext(); setIsListening(!isListening); }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer' }}>
            {isListening ? <MicOff size={18} color="white" /> : <Mic size={18} color="#4f46e5" />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} onFocus={initAudioContext} placeholder="Ask me..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', height: '40px' }} />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={18}/></button>
        </div>
      </footer>

      {/* --- MODALS (Login and Disclaimer only) --- */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div className="modal-content" style={modalStyle}>
            <h2 style={{ fontWeight: '900', margin: 0, fontSize: '20px' }}>VibeAiLink</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={() => { initAudioContext(); setActiveModal('disclaimer'); }}>Start Vibe</button>
          </div>
        </div>
      )}

      {activeModal === 'disclaimer' && (
        <div style={overlayStyle}>
          <div className="modal-content" style={modalStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Privacy & Disclaimer</h2>
            <div style={{ height: '200px', overflowY: 'auto', textAlign: 'left', fontSize: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', lineHeight: '1.6' }}>
              <p><strong>[EN]</strong> AI platform. Users are responsible for content.</p>
              <p><strong>[繁中]</strong> 人工智能平台。用戶需對內容負責。</p>
            </div>
            <button style={primaryButtonStyle} onClick={finalizeLogin}>I Agree</button>
          </div>
        </div>
      )}

      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div className="modal-content" style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #6366f1' }} />
            <input placeholder="Vibe Name..." style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, border: newAvatarGender === 'male' ? '2px solid #6366f1' : 'none' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, border: newAvatarGender === 'female' ? '2px solid #6366f1' : 'none' }}>Female</button>
            </div>
            <button style={primaryButtonStyle} onClick={() => {
              const h: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName, gender: newAvatarGender, canDelete: true };
              const updated = [...selectableHosts, h];
              setSelectableHosts(updated);
              localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
              setTempCapturedImage(null); setNewAvatarName(''); setTempActiveModal('none'); setActiveHost(h);
            }}>Save Vibe</button>
          </div>
        </div>
      )}

      {/* Other modals (deletion, dashboard, logoutConfirm) remain same ... */}
    </main>
  );
}

// Modal Styles
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '30px', width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '14px', width: '100%', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '10px', textAlign: 'left', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', background: '#f8fafc', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' };