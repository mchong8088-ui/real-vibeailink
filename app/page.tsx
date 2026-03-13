"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, User, Mail, Info, ChevronDown, Plus, Check } from 'lucide-react';

// --- 1. DATA MODELS ---
interface Host {
  id: string;
  src: string;
  label: string;
  gender: 'male' | 'female';
  canDelete?: boolean;
  voiceId?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'host';
}

const initialHosts: Host[] = [
  { id: 'nyc', src: '/avatars/NY man.jpg', label: 'Michael 米哥', gender: 'male', canDelete: false, voiceId: 'WuLq5z7nEcrhppO0ZQJw' },
  { id: 'kr', src: '/avatars/HK girl.jpg', label: 'Teresa 麗莎', gender: 'female', canDelete: false, voiceId: 'Xb7hHqWfb21ztUmeCoS5' }
];

const metroDialects = [
  { code: 'zh-HK', label: 'Cantonese (廣東話)' },
  { code: 'zh-CN', label: 'Mandarin (普通話)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'th-TH', label: 'Thai (ไทย)' },
  { code: 'ja-JP', label: 'Japanese (日本語)' },
  { code: 'ko-KR', label: 'Korean (한국어)' },
];

export default function Home() {
  // --- 2. STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  
  // UI & Auth State
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'createAvatar'>('none');

  // Avatar State
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[0]);
  const [selectableHosts, setSelectableHosts] = useState<Host[]>(initialHosts);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 3. PERSISTENCE ---
  useEffect(() => {
    const savedUser = localStorage.getItem('vibe_user_v3');
    const savedCount = localStorage.getItem('vibe_message_count');
    const savedHosts = localStorage.getItem('vibe_custom_hosts');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCount) setMessageCount(parseInt(savedCount));
    if (savedHosts) setSelectableHosts([...initialHosts, ...JSON.parse(savedHosts)]);
  }, []);

  useEffect(() => {
    localStorage.setItem('vibe_message_count', messageCount.toString());
  }, [messageCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- 4. AUTH LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authForm.name && authForm.email.includes('@')) {
      const newUser = { name: authForm.name, email: authForm.email };
      localStorage.setItem('vibe_user_v3', JSON.stringify(newUser));
      setUser(newUser);
      setActiveModal('none');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vibe_user_v3');
    localStorage.removeItem('vibe_message_count');
    setUser(null);
    setMessageCount(0);
    setMessages([]);
    setShowProfile(false);
  };

  // --- 5. CORE CHAT LOGIC ---
  const handleSend = async () => {
    if (!user) {
      setActiveModal('login');
      return;
    }
    if (!text.trim() || isTyping) return;

    const currentInput = text;
    const userMsg: Message = { id: Date.now().toString(), text: currentInput, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, hostName: activeHost.label, language: selectedLang }),
      });
      
      const data = await response.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'host' };
      setMessages(prev => [...prev, aiMsg]);
      setMessageCount(prev => prev + 1);

      // --- 6. AUDIO LOGIC (Voice Synthesis) ---
      const voiceRes = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.reply, voiceId: activeHost.voiceId || "WuLq5z7nEcrhppO0ZQJw" }),
      });

      if (voiceRes.ok) {
        const audioBlob = await voiceRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play().catch(e => console.warn("Autoplay blocked", e));
      }
    } catch (err) {
      console.error("Vibe Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // --- 7. CUSTOM AVATAR LOGIC ---
  const addNewAvatar = (newHost: Host) => {
    const updated = [...selectableHosts, newHost];
    setSelectableHosts(updated);
    const customsOnly = updated.filter(h => h.canDelete);
    localStorage.setItem('vibe_custom_hosts', JSON.stringify(customsOnly));
    setActiveModal('none');
  };

  return (
    <main style={{ height: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes wave { 0%, 100% { height: 8px; opacity: 0.6; } 50% { height: 26px; opacity: 1; } }
        .bar { width: 5px; height: 8px; background: linear-gradient(to bottom, #ec4899, #3b82f6); border-radius: 3px; }
        .speaking .bar { animation: wave 0.6s infinite ease-in-out; }
        .bar:nth-child(1) { animation-delay: 0.0s; } .bar:nth-child(2) { animation-delay: 0.15s; }
        .bar:nth-child(3) { animation-delay: 0.3s; } .bar:nth-child(4) { animation-delay: 0.45s; }
        .nav-link { color: rgba(255,255,255,0.8); text-decoration: none; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .nav-link:hover { color: white; transform: translateY(-1px); }
        .glass-panel { background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .profile-card { position: absolute; top: 70px; right: 40px; width: 280px; padding: 24px; z-index: 1000; border: 1px solid rgba(255,255,255,0.2); animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <header style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#db2777', fontWeight: '900', fontSize: '22px' }}>V</span>
            </div>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '24px' }}>VibeAiLink</span>
          </div>
          <nav style={{ display: 'flex', gap: '25px' }}>
            <span className="nav-link" onClick={() => setShowPricing(true)}>Pricing</span>
            <span className="nav-link">Features</span>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color: 'black'}}>{d.label}</option>)}
          </select>

          {user ? (
            <div onClick={() => setShowProfile(!showProfile)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '25px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ width: '28px', height: '28px', background: '#ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{user.name}</span>
              <ChevronDown size={16} color="white" />
            </div>
          ) : (
            <button onClick={() => setActiveModal('login')} style={{ background: 'white', color: '#4f46e5', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Sign In</button>
          )}
        </div>
      </header>

      {/* FLOATING PROFILE CARD */}
      {showProfile && user && (
        <div className="glass-panel profile-card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
             <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {user.name.charAt(0).toUpperCase()}
             </div>
             <h3 style={{ margin: 0, color: '#1e293b' }}>{user.name}</h3>
             <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>{user.email}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px 0', borderTop: '1px solid #f1f5f9' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Vibes Today:</span>
                <span style={{ fontWeight: 'bold', color: '#ec4899' }}>{messageCount}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>Pro Plan ✓</span>
             </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', marginTop: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '350px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '20px', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={() => setActiveModal('createAvatar')} style={{ background: 'linear-gradient(90deg, #ec4899, #4f46e5)', color: 'white', border: 'none', padding: '16px', borderRadius: '50px', fontWeight: '900', cursor: 'pointer', width: '100%' }}>CREATE NEW AVATAR</button>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectableHosts.map(h => (
              <img key={h.id} src={h.src} onClick={() => {setActiveHost(h); setShowProfile(false);}} style={{ width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', border: activeHost.id === h.id ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.3)', opacity: activeHost.id === h.id ? 1 : 0.6 }} />
            ))}
            <div onClick={() => setActiveModal('createAvatar')} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
               <Plus size={20} />
            </div>
          </div>

          <div style={{ position: 'relative', width: '280px', height: '280px', marginTop: '20px' }}>
            <img src={activeHost.src} style={{ width: '100%', height: '100%', borderRadius: '24px', border: isSpeaking ? '6px solid #ec4899' : '6px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', background: 'rgba(15,15,15,0.8)', padding: '10px 18px', borderRadius: '25px', alignItems: 'center' }} className={isSpeaking ? 'speaking' : ''}>
              <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', marginLeft: '5px' }}>{isSpeaking ? 'SPEAKING' : 'IDLE'}</span>
            </div>
          </div>
          <h2 style={{ color: 'white', fontWeight: '900', fontSize: '28px', margin: 0 }}>{activeHost.label}</h2>
        </div>

        {/* CHAT AREA */}
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.length === 0 && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <Info size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <p>Start a conversation with {activeHost.label}</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#4f46e5' : '#f1f5f9', color: m.sender === 'user' ? 'white' : '#1e293b', padding: '14px 20px', borderRadius: m.sender === 'user' ? '22px 22px 4px 22px' : '22px 22px 22px 4px', maxWidth: '75%', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  {m.text}
                </div>
              ))}
              {isTyping && <div style={{ alignSelf: 'flex-start', padding: '10px 20px', color: '#4f46e5', fontWeight: 'bold' }}>{activeHost.label} is typing...</div>}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: '0 60px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '40px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <button style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer' }}><Mic size={24} color="#64748b" /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={`Message ${activeHost.label}...`} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px' }} />
          <button onClick={handleSend} style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22} /></button>
        </div>
      </footer>

      {/* PRICING MODAL */}
      {showPricing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '1000px', width: '100%', padding: '40px', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
            <button onClick={() => setShowPricing(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={30} /></button>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Choose Your Vibe</h2>
              <p style={{ color: '#64748b', marginTop: '10px' }}>Unlock the full power of Cantonese AI Avatars</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', background: 'white' }}>
                <h3 style={{ margin: 0, color: '#64748b' }}>Starter</h3>
                <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0' }}>$0</div>
                <ul style={{ listStyle: 'none', padding: 0, color: '#475569', lineHeight: '2' }}>
                  <li><Check size={16} /> 10 Messages / day</li>
                  <li><Check size={16} /> Standard Engine</li>
                  <li><Check size={16} /> Email Support</li>
                </ul>
              </div>
              <div style={{ border: '3px solid #ec4899', borderRadius: '24px', padding: '30px', background: 'white', transform: 'scale(1.05)' }}>
                <h3 style={{ margin: 0, color: '#ec4899' }}>Pro Creator</h3>
                <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0' }}>$19</div>
                <ul style={{ listStyle: 'none', padding: 0, color: '#475569', lineHeight: '2' }}>
                  <li><Check size={16} /> Unlimited Messages</li>
                  <li><Check size={16} /> Premium Engine</li>
                  <li><Check size={16} /> Priority Email Support</li>
                </ul>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', background: 'white' }}>
                <h3 style={{ margin: 0 }}>Elite Master</h3>
                <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0' }}>$49</div>
                <ul style={{ listStyle: 'none', padding: 0, color: '#475569', lineHeight: '2' }}>
                  <li><Check size={16} /> Unlimited Customs</li>
                  <li><Check size={16} /> Turbo Engine</li>
                  <li><Check size={16} /> Voice Cloning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {activeModal === 'login' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '35px', width: '400px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <h2 style={{ textAlign: 'center', margin: 0 }}>Welcome to VibeAI</h2>
            <input required type="text" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ padding: '14px', borderRadius: '15px', border: '1px solid #ddd' }} />
            <input required type="email" placeholder="Email Address" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ padding: '14px', borderRadius: '15px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ background: 'linear-gradient(90deg, #4f46e5, #ec4899)', color: 'white', padding: '16px', borderRadius: '15px', fontWeight: 'bold' }}>Enter</button>
          </form>
        </div>
      )}
    </main>
  );
}
