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
  // --- 2. STATE ---
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

  // --- 3. REFS ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- 4. MOBILE AUDIO PERSISTENCE & UNLOCK ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
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

  // --- 5. INITIALIZATION ---
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

  // --- 6. CORE LOGIC ---
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
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play().catch(e => console.error("Audio blocked:", e));
    } catch (err) { console.error("Voice Error:", err); }
  };

  const handleSend = async () => {
    if (!user && msgCount >= 10) { setActiveModal('login'); return; }
    if (!text.trim() || isTyping) return;
    const currentInput = text;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: currentInput, sender: 'user' }]);
    setText(''); 
    setIsTyping(true);
    initAudioContext();

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
      await playVoice(data.reply);
    } catch (err) { console.error("Chat Error:", err); } finally { setIsTyping(false); }
  };

  const handleLoginProceed = () => {
    if (authForm.name && authForm.email) {
      initAudioContext();
      setActiveModal('disclaimer');
    }
  };

  const finalizeLogin = () => {
    initAudioContext();
    const newUser = { name: authForm.name, email: authForm.email };
    setUser(newUser);
    localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
    setActiveModal('none');
  };

  const handleLogout = () => { localStorage.removeItem('vibe_user_v3'); setUser(null); setActiveModal('login'); };

  const startCamera = async () => {
    setActiveModal('camera');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) { console.error(e); setActiveModal('none'); }
  };

  const takeSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      setTempCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
      streamRef.current?.getTracks().forEach(t => t.stop());
      setActiveModal('none');
      setTempActiveModal('captureConfirm');
    }
  };

  // --- 7. UI RENDER ---
  return (
    <main style={{ height: '100dvh', width: '100vw', background: '#1e1b4b', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @media (max-width: 768px) {
          .main-container { flex-direction: row !important; }
          .sidebar { width: 35% !important; padding: 10px !important; border-right: 1px solid rgba(255,255,255,0.1); }
          .chat-area { width: 65% !important; padding: 10px !important; padding-bottom: 120px !important; }
          .big-avatar { width: 100% !important; height: auto !important; border-radius: 12px !important; }
          .small-avatar { width: 32px !important; height: 32px !important; }
          .create-vibe-btn { font-size: 10px !important; padding: 6px !important; line-height: 1.2; }
          .input-footer { position: fixed !important; bottom: 20px !important; left: 0; right: 0; padding: 0 10px !important; z-index: 999; }
          .modal-box { width: 95% !important; max-height: 85vh !important; overflow-y: auto !important; padding: 15px !important; }
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
        
        {/* SIDEBAR: 1/3 Width on Mobile */}
        <div className="sidebar" style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
          
          <button className="create-vibe-btn" onClick={() => setTempActiveModal('uploadType')} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            + Create your own Vibe
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

        {/* CHAT AREA: 2/3 Width on Mobile */}
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
                fontSize: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
        <div style={{ background: 'white', borderRadius: '30px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          <button onClick={() => { initAudioContext(); setIsListening(!isListening); isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start(); }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer' }}>
            {isListening ? <MicOff size={18} color="white" /> : <Mic size={18} color="#4f46e5" />}
          </button>
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            onFocus={initAudioContext}
            placeholder="Ask me..." 
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', height: '40px' }} 
          />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18}/>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={modalStyle}>
            <h2 style={{ fontWeight: '900', margin: 0 }}>Welcome!</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={handleLoginProceed}>Start Vibe</button>
          </div>
        </div>
      )}

      {activeModal === 'disclaimer' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={modalStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Terms & Privacy</h2>
            <div style={{ height: '180px', overflowY: 'auto', fontSize: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <p><strong>[EN]</strong> AI entertainment platform. Users are responsible for content.</p>
              <p><strong>[繁中]</strong> 人工智能娛樂平台。用戶需對內容負責。</p>
            </div>
            <button style={primaryButtonStyle} onClick={finalizeLogin}>I Agree</button>
          </div>
        </div>
      )}

      {activeModal === 'camera' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={{ ...modalStyle, width: '90%' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '15px', background: 'black' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, background: '#ef4444' }} onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setActiveModal('none'); }}>Cancel</button>
              <button style={primaryButtonStyle} onClick={takeSnap}>Capture</button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={modalStyle}>
            <h2 style={{ fontWeight: '900', margin: 0 }}>Create Vibe</h2>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={16}/> Upload Photo</button>
            <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={startCamera}><Camera size={16}/> Use Camera</button>
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
          <div className="modal-box" style={modalStyle}>
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

      {activeModal === 'dashboard' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={modalStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '900' }}>Account</h2>
            <p>{user?.email}</p>
            <button onClick={() => setActiveModal('logoutConfirm')} style={{ ...primaryButtonStyle, background: '#ef4444' }}><LogOut size={16}/> Sign Out</button>
            <button onClick={() => setActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Close</button>
          </div>
        </div>
      )}

      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}>
          <div className="modal-box" style={modalStyle}>
            <h3 style={{ margin: 0 }}>Sign Out?</h3>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={handleLogout} style={{ ...primaryButtonStyle, background: '#ef4444', flex: 1 }}>Yes</button>
              <button onClick={() => setActiveModal('dashboard')} style={{ ...primaryButtonStyle, background: '#ccc', flex: 1 }}>No</button>
            </div>
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