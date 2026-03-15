"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, User, LogOut, Trash2, CheckCircle } from 'lucide-react';

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
  const [msgCount, setMsgCount] = useState(0); // Track trial messages
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  
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
      // Logic 2: If not logged in, show login immediately
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
      const audio = new Audio();
      audio.src = audioUrl;
      audio.preload = "auto";
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsSpeaking(false));
      }
    } catch (err) { console.error("Voice Error:", err); }
  };

  const primeAudio = () => {
    const silentAudio = new Audio();
    silentAudio.play().catch(() => {});
  };

  const handleSend = async () => {
    // Logic 5: Allow 10 trial messages if not logged in
    if (!user && msgCount >= 10) {
      setActiveModal('login');
      return;
    }

    if (!text.trim() || isTyping) return;

    primeAudio(); 
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user' }]);
    const currentInput = text; setText(''); 
    setIsTyping(true);
    
    // Increment trial count if not logged in
    if (!user) {
      const newCount = msgCount + 1;
      setMsgCount(newCount);
      localStorage.setItem('vibe_trial_count', newCount.toString());
    }

    setProgress(10);
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 1 : prev));
    }, 450);

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
    } catch (err) { 
        console.error("Chat Error:", err); 
    } finally { 
        clearInterval(progressInterval);
        setTimeout(() => {
            setIsTyping(false);
            setProgress(0);
        }, 500);
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
    setActiveModal('login'); // Force login window again after logout
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
    const newHost: Host = {
      id: `u-${Date.now()}`, src: tempCapturedImage!,
      label: newAvatarName, gender: newAvatarGender, canDelete: true
    };
    const updated = [...selectableHosts, newHost];
    setSelectableHosts(updated);
    localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(h => h.canDelete)));
    setActiveHost(newHost); setActiveModal('none');
    setTempCapturedImage(null); setNewAvatarName('');
  };

  const confirmDeletion = () => {
    if (hostToDelete) {
      const updated = selectableHosts.filter(h => h.id !== hostToDelete.id);
      setSelectableHosts(updated);
      localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(h => h.canDelete)));
      if (activeHost.id === hostToDelete.id) setActiveHost(updated[0]);
      setActiveModal('none');
    }
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
          {/* Welcome Message (Logic 4) */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 'bold', fontSize: '14px', background: 'rgba(74, 222, 128, 0.1)', padding: '8px 12px', borderRadius: '20px' }}>
              <CheckCircle size={16} />
              Welcome back, {user.name}!
            </div>
          )}

          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '12px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{user.name}</span>
              <LogOut size={20} color="white" onClick={handleLogout} style={{cursor: 'pointer'}} />
            </div>
          ) : (
            /* Login Button (Logic 1: Real Button in Green) */
            <button 
              onClick={() => setActiveModal('login')} 
              style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)' }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '420px', display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(0,0,0,0.15)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)', color: 'white', border: 'none', padding: '18px', borderRadius: '50px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', marginBottom: '20px', flexShrink: 0 }}>+ CREATE NEW VIBE</button>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px', flexShrink: 0 }}>
            {selectableHosts.map(h => (
              <div key={h.id} onPointerDown={() => { if(h.canDelete) { setHostToDelete(h); pressTimer.current = setTimeout(() => setActiveModal('deletion'), 800); } }} onPointerUp={() => { clearTimeout(pressTimer.current!); }}>
                <img src={h.src} onClick={() => setActiveHost(h)} style={{ width: '65px', height: '65px', borderRadius: '50%', border: activeHost.id === h.id ? '4px solid #4ade80' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px', maxHeight: '45vh', aspectRatio: '1/1' }}>
              <img src={activeHost.src} key={activeHost.src} style={{ width: '100%', height: '100%', borderRadius: '40px', border: '8px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '10px 25px', borderRadius: '30px', display: 'flex', gap: '10px', alignItems: 'center', border: '2px solid rgba(255,255,255,0.1)', width: 'max-content' }} className={isSpeaking ? 'speaking' : ''}>
                <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                <span style={{ fontWeight: '800', fontSize: '16px' }}>{activeHost.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            
            {isTyping && (
                <div style={{ position: 'absolute', top: '60px', left: 0, width: '100%', height: '4px', background: '#f1f5f9', zIndex: 5 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #ec4899)', transition: 'width 0.4s ease-out' }} />
                </div>
            )}

            <div style={{ height: '60px', display: 'flex', alignItems: 'center', padding: '0 30px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
                <div style={{ width: '10px', height: '10px', background: isTyping ? '#6366f1' : '#4ade80', borderRadius: '50%', marginRight: '10px' }}></div>
                <h3 style={{ color: '#1e293b', fontWeight: '800', fontSize: '16px' }}>
                    {isTyping ? `${activeHost.label} is thinking...` : `Chatting with ${activeHost.label}`}
                </h3>
                {!user && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                    Trial: {msgCount}/10 messages left
                  </span>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ 
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', 
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9', 
                  color: m.sender === 'user' ? 'white' : '#1e293b', 
                  padding: '18px 25px', 
                  borderRadius: m.sender === 'user' ? '25px 25px 0 25px' : '25px 25px 25px 0', 
                  maxWidth: '85%', fontSize: '19px', fontWeight: '500'
                }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: '0 40px 30px', flexShrink: 0 }}>
        <div style={{ background: 'white', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <button onClick={() => { 
            primeAudio(); 
            if(!user && msgCount >= 10) { setActiveModal('login'); return; }
            setText(''); setIsListening(!isListening); isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start(); 
          }} style={{ background: isListening ? '#ef4444' : '#f1f5f9', border: 'none', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening ? <MicOff color="white" size={22} /> : <Mic color="#4f46e5" size={22} />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleSend(); } }} placeholder={user ? `Say something...` : (msgCount < 10 ? `Trial Mode (${10 - msgCount} left)...` : `Please sign in...`)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '20px', fontWeight: '500', color: '#1e293b' }} />
          <button onClick={() => { handleSend(); }} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22}/></button>
        </div>
      </footer>

      {/* --- ALL OVERLAYS & MODALS --- */}
      
      {/* Login Modal (Logic 3: Centered and High Z-Index) */}
      {activeModal === 'login' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ alignSelf: 'flex-end', cursor: 'pointer' }} onClick={() => setActiveModal('none')}><X color="#94a3b8" /></div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '5px' }}>Let's Vibe!</h2>
            <p style={{ color: '#64748b', textAlign: 'center', fontWeight: '500', fontSize: '14px' }}>Sign in to start talking with your AI companions.</p>
            <input placeholder="Your Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            <input placeholder="Email Address" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <button style={{ ...primaryButtonStyle, background: '#22c55e' }} onClick={handleLogin}>Start Vibrating</button>
          </div>
        </div>
      )}

      {/* Creation Choices */}
      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ alignSelf: 'flex-end', cursor: 'pointer' }} onClick={() => setTempActiveModal('none')}><X color="#94a3b8" /></div>
            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>Create Your Vibe</h2>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={20}/> Select from File</button>
            <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={startCamera}><Camera size={20}/> Take Photo</button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {/* Camera Capture */}
      {activeModal === 'camera' && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: '600px' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '25px', background: 'black' }} />
            <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, flex: 1, background: '#ef4444' }} onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setActiveModal('none'); }}>Cancel</button>
              <button style={{ ...primaryButtonStyle, flex: 1 }} onClick={takeSnap}>Capture</button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* Confirm Captured Image */}
      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <img src={tempCapturedImage!} style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', border: '5px solid #6366f1' }} />
            <input placeholder="Name your Vibe..." style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
            <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, border: newAvatarGender === 'male' ? '3px solid #6366f1' : 'none' }}>Male</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, border: newAvatarGender === 'female' ? '3px solid #6366f1' : 'none' }}>Female</button>
            </div>
            <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, flex: 1, background: '#94a3b8' }} onClick={() => { setTempCapturedImage(null); setTempActiveModal('uploadType'); }}>Retake</button>
              <button style={{ ...primaryButtonStyle, flex: 1 }} onClick={finalizeAvatarCreation}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirm */}
      {activeModal === 'deletion' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <Trash2 size={50} color="#ef4444" />
            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>Delete Vibe?</h2>
            <p style={{ textAlign: 'center', color: '#64748b' }}>Are you sure you want to remove <b>{hostToDelete?.label}</b>?</p>
            <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
              <button style={{ ...primaryButtonStyle, flex: 1, background: '#94a3b8' }} onClick={() => setActiveModal('none')}>No</button>
              <button style={{ ...primaryButtonStyle, flex: 1, background: '#ef4444' }} onClick={confirmDeletion}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// Styling Constants (Ensuring centering and visibility)
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '40px', borderRadius: '40px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' };
const inputStyle: React.CSSProperties = { padding: '18px', width: '100%', borderRadius: '15px', border: '2px solid #f1f5f9', fontSize: '18px', outline: 'none' };
const primaryButtonStyle: React.CSSProperties = { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', padding: '18px', width: '100%', borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '20px', borderRadius: '15px', background: '#f8fafc', fontWeight: '900', cursor: 'pointer', border: 'none', fontSize: '16px' };