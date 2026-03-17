"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Camera, Upload, LogOut, Trash2, CheckCircle, ChevronDown, Volume2, VolumeX, Menu, RefreshCw, Plus } from 'lucide-react';

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
  { id: 'michael', src: '/avatars/nyman.jpg', label: 'Michael 米哥', gender: 'male', canDelete: false },
  { id: 'teresa', src: '/avatars/hkgirl.jpg', label: 'Teresa 麗莎', gender: 'female', canDelete: false },
  { id: 'sophia', src: '/avatars/twgirl.jpg', label: 'Sophia 蘇菲亞', gender: 'female', canDelete: false }
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
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[1]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  
  // Auth & Modals
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'camera' | 'deletion' | 'dashboard' | 'logoutConfirm' | 'disclaimer'>('none');
  const [tempActiveModal, setTempActiveModal] = useState<'none' | 'uploadType' | 'captureConfirm'>('none');
  
  // Avatar Creation & Deletion
  const [tempCapturedImage, setTempCapturedImage] = useState<string | null>(null);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('female');
  const [targetDeleteHost, setTargetDeleteHost] = useState<Host | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // --- 3. REFS ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 4. VOICE LOGIC (Interruption Aware) ---
  const speakLocally = (replyText: string, isWarmup = false) => {
    if (isMuted || !window.speechSynthesis) return;

    // Clear queue instantly
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(isWarmup ? "" : replyText);
    const voices = window.speechSynthesis.getVoices();
    const isFemale = activeHost.gender === 'female';
    const langKey = selectedLang.toLowerCase().replace('_', '-');

    const langVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').includes(langKey));

    const femaleTargets = ['sinji', 'tingting', 'ava', 'samantha', 'victoria', 'mei-jia'];
    const maleTargets = ['aasing', 'han', 'evan', 'danny', 'alex', 'nathan'];
    const targets = isFemale ? femaleTargets : maleTargets;

    let selectedVoice = langVoices.find(v => targets.some(t => v.name.toLowerCase().includes(t)));
    if (!selectedVoice) {
      selectedVoice = langVoices.find(v => isFemale ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male')) || langVoices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = selectedLang;
    utterance.pitch = isFemale ? 1.25 : 0.85;
    utterance.rate = 1.0;
    utterance.volume = isWarmup ? 0 : 1;

    if (!isWarmup) {
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
    window.speechSynthesis.speak(utterance);
  };

  // --- 5. CORE HANDLERS ---
  const handleLanguageChange = (code: string) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSelectedLang(code);
    setTimeout(() => speakLocally("", true), 50); 
  };

  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const currentInput = text;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: currentInput, sender: 'user' }]);
    setText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now().toString() + "-ai", text: data.reply, sender: 'ai' }]);
      speakLocally(data.reply);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  // --- 6. AVATAR & CAMERA ---
  const startCamera = async () => {
    setTempActiveModal('none'); setActiveModal('camera');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s;
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
      setActiveModal('none'); setTempActiveModal('captureConfirm');
    }
  };

  const handleLongPressStart = (h: Host) => {
    if (!h.canDelete) return;
    longPressTimer.current = setTimeout(() => {
      setTargetDeleteHost(h);
      setActiveModal('deletion');
    }, 800);
  };

  const handleLongPressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // --- 7. EFFECTS ---
  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    if (savedUser) setUser(JSON.parse(savedUser)); else setActiveModal('login');
    if (savedHosts) setSelectableHosts([...initialHosts, ...JSON.parse(savedHosts)]);
    
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  return (
    <main style={{ height: '100dvh', width: '100vw', background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', color: 'white', fontFamily: 'sans-serif' }}>
      
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .vibe-circle { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid transparent; transition: 0.3s; cursor: pointer; }
        .vibe-circle.active { border-color: #22c55e; transform: scale(1.1); box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }
        .sound-wave { display: flex; align-items: center; gap: 3px; height: 20px; position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); }
        .bar { width: 3px; height: 5px; background: #4ade80; border-radius: 3px; animation: bounce 0.6s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { height: 5px; } 50% { height: 20px; } }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '60px', background: 'rgba(30, 41, 59, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', background: 'linear-gradient(to br, #6366f1, #ec4899)', borderRadius: '6px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>VibeAiLink</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={selectedLang} onChange={(e) => handleLanguageChange(e.target.value)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
          <button onClick={() => user ? setActiveModal('dashboard') : setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            {user ? 'Menu' : 'Login'}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '280px', background: 'rgba(15, 23, 42, 0.5)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '15px' }}>
          <button onClick={() => setTempActiveModal('uploadType')} style={{ background: '#6366f1', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> Create New Vibe
          </button>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {selectableHosts.map(h => (
              <img 
                key={h.id} 
                src={h.src} 
                onMouseDown={() => handleLongPressStart(h)}
                onMouseUp={handleLongPressEnd}
                onClick={() => { if(window.speechSynthesis) window.speechSynthesis.cancel(); setActiveHost(h); }}
                className={`vibe-circle ${activeHost.id === h.id ? 'active' : ''}`}
              />
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <img src={activeHost.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{activeHost.label}</div>
            
            <button onClick={() => setIsMuted(!isMuted)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {isSpeaking && (
              <div className="sound-wave">
                <div className="bar"></div><div className="bar" style={{animationDelay:'0.1s'}}></div><div className="bar" style={{animationDelay:'0.2s'}}></div><div className="bar" style={{animationDelay:'0.3s'}}></div>
              </div>
            )}
          </div>
        </aside>

        {/* CHAT AREA */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, transparent, rgba(30,41,59,0.2))' }}>
          <div className="chat-scroll" style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{ background: m.sender === 'user' ? '#6366f1' : 'rgba(255,255,255,0.06)', color: 'white', padding: '14px 18px', borderRadius: '22px', border: m.sender === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none', fontSize: '15px', lineHeight: '1.5' }}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', paddingLeft: '10px' }}>{activeHost.label} is crafting a response...</div>}
            <div ref={chatEndRef} />
          </div>

          <footer style={{ padding: '25px' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', background: '#1e293b', padding: '10px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <button onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()} style={{ width: '45px', height: '45px', borderRadius: '50%', background: isListening ? '#ef4444' : 'rgba(255,255,255,0.05)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isListening ? <MicOff size={22}/> : <Mic size={22}/>}
              </button>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Chat with ${activeHost.label}...`} style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '16px' }} />
              <button onClick={handleSend} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#6366f1', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><Send size={22}/></button>
            </div>
          </footer>
        </section>
      </div>

      {/* --- MODALS --- */}
      {activeModal === 'login' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Welcome Back</h2>
          <input placeholder="Your Name" style={inputStyle} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
          <input placeholder="Email Address" style={inputStyle} value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
          <button style={primaryButtonStyle} onClick={() => setActiveModal('disclaimer')}>Continue</button>
        </div></div>
      )}

      {activeModal === 'disclaimer' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <div style={{ textAlign: 'center' }}><CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 15px' }} /></div>
          <h3 style={{ textAlign: 'center' }}>Privacy Notice</h3>
          <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', lineHeight: '1.6' }}>By continuing, you agree that this AI tool is for creative testing. Please do not provide sensitive personal information.</p>
          <button style={primaryButtonStyle} onClick={() => { 
            setUser({ name: authForm.name, email: authForm.email }); 
            localStorage.setItem('vibe_user_v3', JSON.stringify({ name: authForm.name, email: authForm.email })); 
            setActiveModal('none'); 
          }}>I Understand & Agree</button>
        </div></div>
      )}

      {tempActiveModal === 'uploadType' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <h3 style={{ textAlign: 'center' }}>Add Custom Vibe</h3>
          <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()}><Upload size={18} /> Upload Image</button>
          <button style={{ ...primaryButtonStyle, background: '#10b981' }} onClick={startCamera}><Camera size={18} /> Take Photo</button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { setTempCapturedImage(URL.createObjectURL(f)); setTempActiveModal('captureConfirm'); } }} />
          <button onClick={() => setTempActiveModal('none')} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 'bold' }}>Cancel</button>
        </div></div>
      )}

      {activeModal === 'camera' && (
        <div style={overlayStyle}><div style={{ ...modalStyle, width: '90%', maxWidth: '450px' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '20px', background: '#000', aspectRatio: '1/1', objectFit: 'cover' }} />
          <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
            <button style={{ ...primaryButtonStyle, background: '#ef4444', flex: 1 }} onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setActiveModal('none'); }}>Cancel</button>
            <button style={{ ...primaryButtonStyle, flex: 1 }} onClick={takeSnap}>Capture</button>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div></div>
      )}

      {tempActiveModal === 'captureConfirm' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <img src={tempCapturedImage!} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />
          <input placeholder="Avatar Name" style={inputStyle} value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setNewAvatarGender('male')} style={{ flex:1, padding:'10px', borderRadius:'10px', border:'1px solid #ddd', background: newAvatarGender === 'male' ? '#6366f1':'white', color: newAvatarGender === 'male' ? 'white':'black' }}>Male</button>
            <button onClick={() => setNewAvatarGender('female')} style={{ flex:1, padding:'10px', borderRadius:'10px', border:'1px solid #ddd', background: newAvatarGender === 'female' ? '#6366f1':'white', color: newAvatarGender === 'female' ? 'white':'black' }}>Female</button>
          </div>
          <button style={primaryButtonStyle} onClick={() => {
            const h: Host = { id: `u-${Date.now()}`, src: tempCapturedImage!, label: newAvatarName || 'Stranger', gender: newAvatarGender, canDelete: true };
            const updated = [...selectableHosts, h]; setSelectableHosts(updated);
            localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
            setTempActiveModal('none'); setActiveHost(h);
          }}>Create Vibe</button>
        </div></div>
      )}

      {activeModal === 'deletion' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <div style={{ textAlign:'center' }}><Trash2 size={45} color="#ef4444" style={{ margin:'0 auto 15px' }} /></div>
          <h3 style={{ textAlign:'center' }}>Delete Vibe?</h3>
          <p style={{ textAlign:'center', fontSize:'14px', color:'#64748b' }}>Are you sure you want to remove <b>{targetDeleteHost?.label}</b>?</p>
          <div style={{ display:'flex', gap:'12px', marginTop:'10px' }}>
            <button style={{ ...primaryButtonStyle, background: '#ef4444', flex: 1 }} onClick={() => {
              const updated = selectableHosts.filter(h => h.id !== targetDeleteHost?.id);
              setSelectableHosts(updated); localStorage.setItem('vibe_custom_hosts', JSON.stringify(updated.filter(x => x.canDelete)));
              setActiveModal('none'); if(activeHost.id === targetDeleteHost?.id) setActiveHost(initialHosts[0]);
            }}>Delete</button>
            <button style={{ ...primaryButtonStyle, background: '#f1f5f9', color:'#000', flex: 1 }} onClick={() => setActiveModal('none')}>Keep</button>
          </div>
        </div></div>
      )}

      {activeModal === 'dashboard' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px' }}>
            <h3 style={{ margin:0 }}>Settings</h3>
            <button onClick={() => setActiveModal('none')} style={{ background:'none', border:'none' }}><X size={20}/></button>
          </div>
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Signed in as</div>
            <div style={{ fontWeight: 'bold' }}>{user?.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{user?.email}</div>
          </div>
          <button style={{ ...primaryButtonStyle, background: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', gap: '8px' }} onClick={() => setActiveModal('logoutConfirm')}>
            <LogOut size={18} /> Log Out
          </button>
        </div></div>
      )}

      {activeModal === 'logoutConfirm' && (
        <div style={overlayStyle}><div style={modalStyle}>
          <h3 style={{ textAlign: 'center' }}>Log Out?</h3>
          <p style={{ textAlign: 'center', fontSize: '14px' }}>Your custom vibes and chat history will be cleared.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ ...primaryButtonStyle, background: '#ef4444', flex: 1 }} onClick={() => { 
              localStorage.removeItem('vibe_user_v3'); 
              localStorage.removeItem('vibe_custom_hosts'); 
              window.location.reload(); 
            }}>Log Out</button>
            <button style={{ ...primaryButtonStyle, background: '#f1f5f9', color:'#000', flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
          </div>
        </div></div>
      )}
    </main>
  );
}

// SHARED STYLES
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(8px)' };
const modalStyle: React.CSSProperties = { background: 'white', padding: '30px', borderRadius: '30px', width: '340px', display: 'flex', flexDirection: 'column', gap: '15px', color: 'black', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' };
const inputStyle: React.CSSProperties = { padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '100%', outline: 'none', fontSize: '15px' };
const primaryButtonStyle: React.CSSProperties = { background: '#6366f1', color: 'white', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' };