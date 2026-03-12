"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react'; 

// --- 1. DATA MODELS ---
interface Host {
  id: string;
  src: string;
  label: string;
  gender: 'male' | 'female';
  canDelete?: boolean; 
  customVoiceId?: string; // Added to store specific voice for custom avatars
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const initialHosts: Host[] = [
  { id: 'nyc', src: '/avatars/NY man.jpg', label: 'Michael 米哥', gender: 'male', canDelete: false },
  { id: 'kr', src: '/avatars/HK girl.jpg', label: 'Teresa 麗莎', gender: 'female', canDelete: false },
  { id: 'u-initial', src: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff', label: 'Mandie', gender: 'male', canDelete: true }
];

const metroDialects = [
  { code: 'zh-HK', label: 'Cantonese (廣東話)' },
  { code: 'zh-CN', label: 'Mandarin (普通話)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'th-TH', label: 'Thai (ไทย)' },
  { code: 'ja-JP', label: 'Japanese (日本語)' },
  { code: 'ko-KR', label: 'Korean (한국어)' },
];

export default function VibeAiApp() {
 // --- 2. STATE MANAGEMENT ---
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Step 1: Speaking State
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false); 
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]); 
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [activeModal, setActiveModal] = useState<'none' | 'naming' | 'gender' | 'deletion' | 'selection' | 'camera' | 'confirm'>('none');
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('male');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [hostToDelete, setHostToDelete] = useState<Host | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 3. SPEECH-TO-TEXT LOGIC ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; 
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText(currentTranscript); 
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText(''); 
      recognitionRef.current.lang = selectedLang; 
      try { recognitionRef.current.start(); setIsListening(true); } catch (err) {}
    }
  };

  // --- 4. VOICE PLAYBACK LOGIC (Integrated Step 2) ---
  const playVoice = async (replyText: string, host: Host) => {
    const voiceMap: { [key: string]: string } = {
      'nyc': 'WuLq5z7nEcrhppO0ZQJw',
      'kr': 'ByhETIclHirOlWnWKhHc'
    };

    let voiceId = voiceMap[host.id];
    if (!voiceId) {
      voiceId = host.gender === 'male' ? 'GhkQkxbimoIykF4iGYqh' : 'acCWxmzPBgXdHwA63uzP';
    }

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, voiceId: voiceId }),
      });

      if (!response.ok) throw new Error('Voice failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Trigger animation on play, stop on end
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      audio.play();
    } catch (err) {
      console.error("Audio error:", err);
      setIsSpeaking(false);
    }
  };

  // --- 5. THE BRAIN & ROUTER LOGIC ---
  const handleSend = async () => {
    if (!text.trim() || isTyping) return;

    const currentInput = text;
    const userMsg: Message = { id: Date.now().toString(), text: currentInput, sender: 'user' };
    
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setIsTyping(true);
    setShowChat(true);

    try {
      // 1. Get Chat Response from Gemini
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput, 
          hostName: activeHost.label, 
          language: selectedLang 
        }),
      });
      
      if (!response.ok) throw new Error('Chat API failed');
      const data = await response.json();

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'host' };
      setMessages(prev => [...prev, aiMsg]);

      // 2. Integrated Voice Logic (Replacing old playVoice)
      const voiceRes = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: data.reply, 
          voiceId: activeHost.voiceId || "WuLq5z7nEcrhppO0ZQJw" 
        }),
      });

      if (voiceRes.ok) {
        const audioBlob = await voiceRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // This triggers the Pink/Blue visualizer bars
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play().catch(e => console.warn("Autoplay blocked:", e));
      }
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // --- 6. AVATAR & CAMERA LOGIC ---
  const finalizeAvatarNaming = () => {
    if (tempCapturedImage && newAvatarName.trim()) {
      const newUser: Host = { id: `u-${Date.now()}`, src: tempCapturedImage, label: newAvatarName, gender: newAvatarGender, canDelete: true };
      setSelectableHosts([...selectableHosts, newUser]);
      setActiveHost(newUser);
      closeAllModals();
      setNewAvatarName('');
    }
  };

  const closeAllModals = () => {
    stopCamera();
    setActiveModal('none');
    setTempCapturedImage(null);
    setHostToDelete(null);
  };

  const handleAvatarPressStart = (host: Host) => {
    if (host.canDelete) {
      setHostToDelete(host);
      if (pressTimer.current) clearTimeout(pressTimer.current);
      pressTimer.current = setTimeout(() => setActiveModal('deletion'), 800);
    }
  };

  const handleAvatarPressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const confirmDeletion = () => {
    if (hostToDelete) {
      const updatedList = selectableHosts.filter(h => h.id !== hostToDelete.id);
      setSelectableHosts(updatedList);
      if (activeHost.id === hostToDelete.id) setActiveHost(updatedList[0]);
      closeAllModals();
    }
  };

  const startCamera = async () => {
    setActiveModal('camera');
    setIsCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
    } catch (err) { setActiveModal('none'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
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
        setActiveModal('confirm');
        stopCamera();
      }
    }
  };

 // --- 7. USER INTERFACE ---
  return (
    <main style={{ height: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* Vibe AI Themed Audio Wave Animation */}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; opacity: 0.6; }
          50% { height: 26px; opacity: 1; }
        }
        .bar {
          width: 5px;
          height: 8px;
          background: linear-gradient(to bottom, #ec4899, #3b82f6);
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        .speaking .bar {
          animation: wave 0.6s infinite ease-in-out;
        }
        .bar:nth-child(1) { animation-delay: 0.0s; }
        .bar:nth-child(2) { animation-delay: 0.15s; }
        .bar:nth-child(3) { animation-delay: 0.3s; }
        .bar:nth-child(4) { animation-delay: 0.45s; }
        .bar:nth-child(5) { animation-delay: 0.2s; }
        
        .nav-link {
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover {
          color: white;
        }
      `}</style>

      {/* ENHANCED HEADER */}
      <header style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#db2777', fontWeight: '900', fontSize: '22px' }}>V</span>
            </div>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '24px', letterSpacing: '-0.5px' }}>VibeAiLink</span>
          </div>

          <nav style={{ display: 'flex', gap: '25px' }}>
            <span className="nav-link">Features</span>
            <span className="nav-link">Pricing</span>
            <span className="nav-link">Showcase</span>
            <span className="nav-link">API</span>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', outline: 'none' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>
          <button style={{ background: 'transparent', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Sign In</button>
          <button style={{ background: 'white', color: '#4f46e5', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>Get Started</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '350px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={() => setActiveModal('selection')} style={{ background: 'linear-gradient(90deg, #ec4899, #4f46e5)', color: 'white', border: 'none', padding: '16px', borderRadius: '50px', fontWeight: '900', cursor: 'pointer', width: '100%', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>CREATE NEW AVATAR</button>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectableHosts.map(h => (
              <button key={h.id} onClick={() => setActiveHost(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: activeHost.id === h.id ? 1 : 0.4, position: 'relative' }}>
                <img src={h.src} style={{ width: '50px', height: '50px', borderRadius: '50%', border: activeHost.id === h.id ? '2px solid #ec4899' : '1px solid white', objectFit: 'cover' }} />
              </button>
            ))}
          </div>

          <hr style={{ width: '100%', border: '0.5px solid rgba(255,255,255,0.1)' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '280px', height: '280px' }}>
              <img src={activeHost.src} style={{ width: '100%', height: '100%', borderRadius: '24px', border: isSpeaking ? '6px solid #ec4899' : '6px solid rgba(255,255,255,0.15)', objectFit: 'cover', background: '#000', transition: 'all 0.4s ease', filter: isSpeaking ? 'brightness(1.1) drop-shadow(0 0 25px rgba(236, 72, 153, 0.5))' : 'none' }} />
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(15, 15, 15, 0.7)', padding: '10px 18px', borderRadius: '25px', height: '44px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: isSpeaking ? '0 0 20px rgba(236, 72, 153, 0.4)' : 'none' }} className={isSpeaking ? 'speaking' : ''}>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', marginLeft: '8px', letterSpacing: '1px' }}>{isSpeaking ? 'AI ACTIVE' : 'VIBE IDLE'}</span>
              </div>
            </div>
            <div style={{ marginTop: '15px', color: 'white', fontWeight: '900', fontSize: '20px', letterSpacing: '0.5px' }}>{activeHost.label}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.96)', borderRadius: '35px', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            <div style={{ background: '#fcfcfd', padding: '18px 30px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#4f46e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Vibe Session: {activeHost.label}</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#f3f4f6', color: m.sender === 'user' ? 'white' : '#1f2937', padding: '14px 20px', borderRadius: m.sender === 'user' ? '22px 22px 4px 22px' : '22px 22px 22px 4px', maxWidth: '75%', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  {m.text}
                </div>
              ))}
              {isTyping && <div style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '14px', color: '#6366f1', fontWeight: '600' }}>{activeHost.label} is analyzing...</div>}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '0 60px 40px', background: 'transparent' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto', background: 'white', borderRadius: '40px', padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 15px 35px rgba(0,0,0,0.25)' }}>
          <button onClick={toggleListening} style={{ background: isListening ? '#ef4444' : '#f3f4f6', color: isListening ? 'white' : '#4b5563', border: 'none', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening ? <MicOff size={26} /> : <Mic size={26} />}
          </button>
          <textarea placeholder={`Message ${activeHost.label}...`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', resize: 'none', height: '50px', paddingTop: '15px', color: '#1f2937' }} />
          <button onClick={handleSend} disabled={!text.trim() || isTyping} style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: 'white', width: '55px', height: '55px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (text.trim() && !isTyping) ? 1 : 0.5 }}>
            <Send size={22} />
          </button>
        </div>
      </footer>

      {activeModal === 'selection' && (
        <div style={modalOverlayStyle}><div style={modalContentStyle}>
            <button onClick={() => fileInputRef.current?.click()} style={modalButtonStyle}>📁 UPLOAD IMAGE</button>
            <button onClick={startCamera} style={modalButtonStyle}>📷 USE CAMERA</button>
            <button onClick={() => setActiveModal('none')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>CANCEL</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { setTempCapturedImage(URL.createObjectURL(file)); setActiveModal('naming'); }
            }} />
        </div></div>
      )}

      {activeModal === 'camera' && (
        <div style={modalOverlayStyle}><div style={{ ...modalContentStyle, width: '500px' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '20px', transform: 'scaleX(-1)', background: '#000' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
              <button onClick={closeAllModals} style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>CANCEL</button>
              <button onClick={takeSnap} disabled={!isCameraReady} style={{ flex: 1, background: '#4f46e5', color: 'white', padding: '15px', borderRadius: '15px' }}>TAKE PHOTO</button>
            </div>
        </div></div>
      )}

      {activeModal === 'confirm' && (
        <div style={modalOverlayStyle}><div style={modalContentStyle}>
            {tempCapturedImage && <img src={tempCapturedImage} style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover' }} />}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={startCamera} style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>RE-TAKE</button>
              <button onClick={() => setActiveModal('naming')} style={{ flex: 1, background: '#22c55e', color: 'white', padding: '15px', borderRadius: '15px' }}>CONFIRM</button>
            </div>
        </div></div>
      )}

      {activeModal === 'naming' && (
        <div style={modalOverlayStyle}><div style={modalContentStyle}>
            <h3>Name your Assistant:</h3>
            <input type="text" value={newAvatarName} onChange={(e) => setNewAvatarName(e.target.value)} style={{ padding: '15px', width: '100%', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button onClick={() => setActiveModal('gender')} disabled={!newAvatarName.trim()} style={{ background: '#4f46e5', color: 'white', padding: '15px', width: '100%', borderRadius: '15px', border: 'none', cursor: 'pointer' }}>NEXT: CHOOSE VOICE</button>
        </div></div>
      )}

      {activeModal === 'gender' && (
        <div style={modalOverlayStyle}><div style={modalContentStyle}>
            <h3>Select Voice Gender:</h3>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setNewAvatarGender('male')} style={{ ...genderButtonStyle, border: newAvatarGender === 'male' ? '3px solid #4f46e5' : '1px solid #ddd' }}>♂️ MALE</button>
              <button onClick={() => setNewAvatarGender('female')} style={{ ...genderButtonStyle, border: newAvatarGender === 'female' ? '3px solid #db2777' : '1px solid #ddd' }}>♀️ FEMALE</button>
            </div>
            <button onClick={finalizeAvatarNaming} style={{ background: '#22c55e', color: 'white', padding: '15px', width: '100%', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>SAVE & CREATE</button>
        </div></div>
      )}

      {activeModal === 'deletion' && (
        <div style={modalOverlayStyle}><div style={modalContentStyle}>
            <h3 style={{ color: '#ef4444' }}>Delete this Assistant?</h3>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button onClick={closeAllModals} style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>CANCEL</button>
                <button onClick={confirmDeletion} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '15px', borderRadius: '15px' }}>DELETE</button>
            </div>
        </div></div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </main>
  );
}

// --- 8. STYLES ---
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '40px', borderRadius: '40px', width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' };
const modalButtonStyle: React.CSSProperties = { padding: '20px', background: '#f3f4f6', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', width: '100%' };
const genderButtonStyle: React.CSSProperties = { flex: 1, padding: '20px', borderRadius: '15px', background: '#f9fafb', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };