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
  
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [msgCount, setMsgCount] = useState(0); 
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
  // Modals
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
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

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
        for (let i = event.resultIndex; i < event.results.length; ++i) transcript += event.results[i][0].transcript;
        setText(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const playVoice = async (replyText: string) => {
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
    setProgress(10);
    const progressInterval = setInterval(() => setProgress(prev => (prev < 90 ? prev + 1 : prev)), 450);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' }]);
      await playVoice(data.reply);
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
    setActiveModal('login');
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
    <main style={{ height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes wave { 0%, 100% { height: 10px; transform: scaleY(1); } 50% { height: 40px; transform: scaleY(1.5); } }
        .bar { width: 6px; height: 12px; background: #00f2fe; border-radius: 3px; box-shadow: 0 0 10px #00f2fe; }
        .speaking .bar { animation: wave 0.5s infinite ease-in-out; background: #ec4899; box-shadow: 0 0 10px #ec4899; }
        .bar:nth-child(2) { animation-delay: 0.1s; }
        .bar:nth-child(3) { animation-delay: 0.2s; }
        .bar:nth-child(4) { animation-delay: 0.15s; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '24px' }}>V</span>
          </div>
          <span style={{ color: 'white', fontWeight: '900', fontSize: '26px' }}>VibeAiLink</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          
          {user ? (
            <button 
              onClick={() => setActiveModal('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '50px', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%' }} />
              Welcome, {user.name}
              <ChevronDown size={16} />
            </button>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Login</button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '420px', display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(0,0,0,0.15)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)', color: 'white', border: 'none', padding: '18px', borderRadius: '50px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', marginBottom: '20px', flexShrink: 0 }}>+ CREATE NEW VIBE</button>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
            {selectableHosts.map(h => (
              <img key={h.id} src={h.src} onClick={() => setActiveHost(h)} style={{ width: '65px', height: '65px', borderRadius: '50%', border: activeHost.id === h.id ? '4px solid #4ade80' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <img src={activeHost.src} style={{ width: '100%', borderRadius: '40px', border: '8px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '10px 25px', borderRadius: '30px', display: 'flex', gap: '10px', alignItems: 'center', border: '2px solid rgba(255,255,255,0.1)' }} className={isSpeaking ? 'speaking' : ''}>
                <div className="bar"></div><div className="bar"></div><div className="bar"></div><span style={{ fontWeight: '800' }}>{activeHost.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', padding: '0 30px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <h3 style={{ color: '#1e293b', fontWeight: '800' }}>{isTyping ? `${activeHost.label} is thinking...` : `Chatting with ${activeHost.label}`}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>Trial: {msgCount}/10</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9', color: m.sender === 'user' ? 'white' : '#1e293b', padding: '18px 25px', borderRadius: '25px', maxWidth: '85%', fontSize: '19px' }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '0 40px 30px' }}>
        <div style={{ background: 'white', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => { setIsListening(!isListening); isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start(); }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer' }}>
            {isListening ? <MicOff color="white" /> : <Mic color="#4f46e5" />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Say something..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '20px' }} />
          <button onClick={handleSend} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer' }}><Send /></button>
        </div>
      </footer>

      {/* DASHBOARD MODAL */}
      {activeModal === 'dashboard' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900' }}>Member Dashboard</h2>
              <X onClick={() => setActiveModal('none')} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ width: '100%', background: '#f1f5f9', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Account Email</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.email}</p>
            </div>
            <button style={menuItemStyle}><User size={18}/> My Profile</button>
            <button style={menuItemStyle}><CreditCard size={18}/> Billing & Plans</button>
            <div style={{ height: '1px', background: '#eee', width: '100%' }} />
            <button onClick={() => setActiveModal('logoutConfirm')} style={{ ...menuItemStyle, color: '#ef4444' }}><LogOut size={18}/> Logout</button>
            <button onClick={() => setActiveModal('none')} style={{ ...primaryButtonStyle, background: '#94a3b8', marginTop: '10px' }}>Close & Return</button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Confirm Logout?</h2>
            <p style={{ textAlign: 'center', color: '#64748b' }}>Are you sure you want to sign out? You will need to enter your email again next time.</p>
            <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
               <button onClick={handleLogout} style={{ ...primaryButtonStyle, background: '#ef4444', flex: 1 }}>Yes, Logout</button>
               <button onClick={() => setActiveModal('dashboard')} style={{ ...primaryButtonStyle, background: '#94a3b8', flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontSize: '28px', fontWeight: '900' }}>Let's Vibe!</h2>
            <input placeholder="Your Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email Address" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={primaryButtonStyle} onClick={handleLogin}>Start Vibrating</button>
          </div>
        </div>
      )}

      {/* Creation Choices */}
      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <X onClick={() => setTempActiveModal('none')} style={{ alignSelf: 'flex-end', cursor: 'pointer' }} />
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}>Upload File</button>
            <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={startCamera}>Take Photo</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setTempCapturedImage(URL.createObjectURL(file)); setTempActiveModal('captureConfirm'); }
            }} />
          </div>
        </div>
      )}

      {/* Camera Capture */}
      {activeModal === 'camera' && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: '600px' }}>
            <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '25px' }} />
            <button style={primaryButtonStyle} onClick={takeSnap}>Capture</button>
          </div>
        </div>
      )}

      {/* Naming / Confirm */}
      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
            <input placeholder="Name your Vibe..." style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, background: newAvatarGender === 'male' ? '#6366f1' : '#f1f5f9', color: newAvatarGender === 'male' ? 'white' : 'black' }}>Male</button>
                <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, background: newAvatarGender === 'female' ? '#6366f1' : '#f1f5f9', color: newAvatarGender === 'female' ? 'white' : 'black' }}>Female</button>
            </div>
            <button style={primaryButtonStyle} onClick={finalizeAvatarCreation}>Save Vibe</button>
          </div>
        </div>
      )}

    </main>
  );
}

// Styling Constants
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '30px', borderRadius: '30px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { padding: '15px', width: '100%', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '16px' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '15px', width: '100%', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const menuItemStyle: React.CSSProperties = { width: '100%', border: 'none', background: 'none', padding: '12px', textAlign: 'left', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer' };