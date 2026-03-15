"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, LogOut, Trash2, CheckCircle, ChevronDown, Volume2, VolumeX } from 'lucide-react';

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
  const [progress, setProgress] = useState(0); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0); 
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'camera' | 'naming' | 'gender' | 'deletion' | 'dashboard' | 'logoutConfirm'>('none');
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

  const playVoice = async (replyText: string) => {
    if (isMuted) return;
    const currentVoiceId = activeHost.gender === 'male' ? 'cHDwXsKG0qHMNLIjOusN' : 'n4xdXKggn5lFcXFYE4TA';
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, voiceId: currentVoiceId }),
      });
      if (!response.ok) return;
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };
      audio.play().catch(() => setIsSpeaking(false));
    } catch (err) { console.error("Voice Error:", err); }
  };

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
      await playVoice(data.reply);
    } catch (err) { console.error("Chat Error:", err); } finally { setIsTyping(false); }
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
    setActiveModal('login');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempCapturedImage(URL.createObjectURL(file));
      setTempActiveModal('captureConfirm');
    }
  };

  const startCamera = async () => {
    setTempActiveModal('none');
    setActiveModal('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { setActiveModal('none'); }
  };

  const takeSnap = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (v && c) {
      const size = Math.min(v.videoWidth, v.videoHeight);
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.translate(c.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, size, size);
        setTempCapturedImage(c.toDataURL('image/png'));
        streamRef.current?.getTracks().forEach(t => t.stop());
        setActiveModal('none');
        setTempActiveModal('captureConfirm'); 
      }
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
    <main style={{ height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes wave { 0%, 100% { height: 10px; transform: scaleY(1); } 50% { height: 40px; transform: scaleY(1.5); } }
        .bar { width: 6px; height: 12px; background: #00f2fe; border-radius: 3px; box-shadow: 0 0 10px #00f2fe; }
        .speaking .bar { animation: wave 0.5s infinite ease-in-out; background: #ec4899; box-shadow: 0 0 10px #ec4899; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '35px', height: '35px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>V</span>
          </div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '20px' }}>VibeAiLink</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          
          {user ? (
            <button onClick={() => setActiveModal('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '50px', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>
              <CheckCircle size={16} color="#4ade80" /> Welcome, {user.name} <ChevronDown size={18} />
            </button>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Login</button>
          )}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR: ACTION 3 - 210px (1/2 size) */}
        <div style={{ width: '210px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '15px', background: 'rgba(0,0,0,0.15)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)', color: 'white', border: 'none', padding: '14px', borderRadius: '50px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '15px' }}>+ CREATE VIBE</button>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '15px' }}>
            {selectableHosts.map(h => (
              <img key={h.id} src={h.src} onClick={() => setActiveHost(h)} style={{ width: '45px', height: '45px', borderRadius: '50%', border: activeHost.id === h.id ? '3px solid #4ade80' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '170px' }}>
              <img src={activeHost.src} style={{ width: '100%', borderRadius: '25px', border: '5px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              
              {/* ACTION 5: Speaker Icon */}
              <button onClick={() => setIsMuted(!isMuted)} style={{ position: 'absolute', bottom: '10px', left: '10px', background: isMuted ? '#ef4444' : '#22c55e', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#0f172a', color: 'white', padding: '6px 12px', borderRadius: '15px', display: 'flex', gap: '5px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }} className={isSpeaking ? 'speaking' : ''}>
                <div className="bar"></div><span style={{ fontWeight: '800', fontSize: '12px' }}>{activeHost.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT AREA: ACTION 4 - Harmonized Size */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '30px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', width: '100%', maxWidth: '750px' }}>
            <div style={{ height: '45px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '14px' }}>{isTyping ? "Thinking..." : `Chatting with ${activeHost.label}`}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#64748b' }}>Trial: {msgCount}/10</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#6366f1' : '#f1f5f9', color: m.sender === 'user' ? 'white' : '#1e293b', padding: '12px 18px', borderRadius: '18px', maxWidth: '85%', fontSize: '17px' }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: ACTION 4 - Centered and Smaller Input */}
      <footer style={{ padding: '0 30px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '50px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '100%', maxWidth: '550px' }}>
          <button onClick={() => { setIsListening(!isListening); isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start(); }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer' }}>
            {isListening ? <MicOff size={20} color="white" /> : <Mic size={20} color="#4f46e5" />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Say something..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '17px' }} />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer' }}><Send size={18}/></button>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal === 'dashboard' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Account</h2>
              <X onClick={() => setActiveModal('none')} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ width: '100%', padding: '12px', background: '#f8fafc', borderRadius: '12px', textAlign: 'left' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>Account Email</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.email}</p>
            </div>
            <button onClick={() => setActiveModal('logoutConfirm')} style={{ ...menuItemStyle, color: '#ef4444' }}><LogOut size={18}/> Sign Out</button>
            <button onClick={() => setActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Close</button>
          </div>
        </div>
      )}

      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontWeight: '900' }}>Welcome!</h2>
            <input placeholder="Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={handleLogin}>Start Vibe</button>
          </div>
        </div>
      )}

      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontWeight: '900' }}>Create Vibe</h2>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={18}/> Upload Photo</button>
            <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={startCamera}><Camera size={18}/> Use Camera</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            <button onClick={() => setTempActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}

      {activeModal === 'camera' && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: '550px' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '20px', background: 'black' }} />
            <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, background: '#ef4444' }} onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setActiveModal('none'); }}>Cancel</button>
              <button style={primaryButtonStyle} onClick={takeSnap}>Capture</button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #6366f1' }} />
            <input placeholder="Avatar Name..." style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, border: newAvatarGender === 'male' ? '2px solid #6366f1' : 'none' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, border: newAvatarGender === 'female' ? '2px solid #6366f1' : 'none' }}>Female</button>
            </div>
            <button style={primaryButtonStyle} onClick={finalizeAvatarCreation}>Save Avatar</button>
          </div>
        </div>
      )}

      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Sign Out?</h3>
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

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '35px', width: '90%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '14px', width: '100%', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '10px', textAlign: 'left', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' };