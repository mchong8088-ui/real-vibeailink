"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, AlertTriangle, Mail, User, MessageSquare, ShieldCheck, CreditCard } from 'lucide-react';

// --- 1. DATA MODELS & CONFIG ---
interface Host { id: string; src: string; label: string; gender: 'male' | 'female'; }
interface Message { id: string; text: string; sender: 'user' | 'ai'; }

const initialHosts: Host[] = [
  { id: 'michael', src: '/avatars/nyman.jpg', label: 'Michael 米哥', gender: 'male' },
  { id: 'teresa', src: '/avatars/hkgirl.jpg', label: 'Teresa 麗莎', gender: 'female' },
  { id: 'sophia', src: '/avatars/twgirl.jpg', label: 'Sophia 蘇菲亞', gender: 'female' }
];

const contentMap: Record<string, any> = {
  'zh-HK': {
    about: '關於我們', features: '功能特點', pricing: '服務定價',
    contact: '聯絡我們', disclaimer: '免責聲明', policy: '私隱與條款',
    placeholder: '輸入訊息...', assistant: '您的 AI 助手',
    thinking: '正在思考...', login: '登入', menu: '功能表',
    disclaimerTitle: '重要提示與免責聲明',
    disclaimerBody: '本程式提供的所有報告、對話內容及股票評論均由 AI 自動生成，僅供研究及參考用途。我們不對資訊的準確性或完整性承擔任何法律責任。用戶應自行評估風險，並根據個人情況作出決定。投資涉及風險，入市需謹慎。此外，本平台所提供的技術分析、市場預測及情緒分析僅為數據模型之輸出，不構成任何形式的投資建議。',
    policyTitle: '私隱與訂閱條款',
    policyBody: '[English] 1. No refunds. 2. Unsubscribe anytime. \n[中文] 1. 本服務不設退款。 2. 可隨時取消。',
    accept: '本人已閱讀並同意', next: '下一步', scrollPrompt: '請滾動到底部以解鎖按鈕 ↓',
    contactTitle: '聯絡我們', contactName: '您的姓名', contactEmail: '電郵地址',
    contactMsg: '您的訊息 (限約80字)', contactSend: '發送訊息', contactSuccess: '訊息已收到！',
    unsubBtn: '取消訂閱', close: '關閉'
  },
  'zh-CN': {
    about: '關於我們', features: '功能特点', pricing: '服务定价',
    contact: '联系我们', disclaimer: '免责声明', policy: '隐私与条款',
    placeholder: '输入消息...', assistant: '您的 AI 助手',
    thinking: '正在思考...', login: '登录', menu: '菜单',
    disclaimerTitle: '重要提示与免责声明',
    disclaimerBody: '本程序提供的所有报告、对话内容及股票评论均由 AI 自动生成，仅供研究及参考用途。我们不对信息的准确性或完整性承担任何法律责任。用户应自行评估风险。投资涉及风险，入市需谨慎。',
    policyTitle: '隐私与订阅条款',
    policyBody: '[English] 1. No refunds. 2. Unsubscribe anytime. \n[中文] 1. 本服务不设退款。 2. 可随时取消。',
    accept: '本人已閱讀並同意', next: '下一步', scrollPrompt: '请滚动到底部以解锁按钮 ↓',
    contactTitle: '联系我们', contactName: '您的姓名', contactEmail: '电邮地址',
    contactMsg: '您的消息 (限约80字)', contactSend: '发送消息', contactSuccess: '消息已收到！',
    unsubBtn: '取消订阅', close: '关闭'
  },
  'en-US': {
    about: 'About Us', features: 'Features', pricing: 'Pricing',
    contact: 'Contact Us', disclaimer: 'Disclaimer', policy: 'Policy & Terms',
    placeholder: 'Type a message...', assistant: 'Your AI Assistant',
    thinking: 'Thinking...', login: 'Login', menu: 'Menu',
    disclaimerTitle: 'Important Notice & Disclaimer',
    disclaimerBody: 'All reports, conversations, and stock comments provided by this application are AI-generated for research and reference purposes only. We do not assume any legal responsibility for the accuracy or completeness of the information. Users should assess risks independently. Investment involves risk.',
    policyTitle: 'Privacy & Subscription Policy',
    policyBody: '1. No refunds are provided. 2. Users may unsubscribe or change plans at any time. 3. Upon unsubscribing, benefits remain active until the end of the current billing period.',
    accept: 'I Have Read and Agree', next: 'Next', scrollPrompt: 'Please scroll to the bottom to unlock ↓',
    contactTitle: 'Contact Us', contactName: 'Your Name', contactEmail: 'Email Address',
    contactMsg: 'Your Message (~80 words)', contactSend: 'Send Message', contactSuccess: 'Message received!',
    unsubBtn: 'Unsubscribe', close: 'Close'
  }
};

const metroDialects = [
  { code: 'zh-HK', label: 'Cantonese (廣東話)' },
  { code: 'zh-CN', label: 'Mandarin (普通話)' },
  { code: 'en-US', label: 'English (US)' }
];

export default function VibeAiApp() {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeHost, setActiveHost] = useState<Host>(initialHosts[1]);
  const [selectedLang, setSelectedLang] = useState('zh-HK');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'disclaimer' | 'contact' | 'policy'>('none');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const disclaimerScrollRef = useRef<HTMLDivElement>(null);
  const ui = contentMap[selectedLang] || contentMap['en-US'];

  const removeEmojis = (str: string) => str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

  const speakLocally = (replyText: string, isWarmup = false) => {
    if ((isMuted && !isWarmup) || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(removeEmojis(replyText));
    const voices = window.speechSynthesis.getVoices();
    const langKey = selectedLang.toLowerCase().replace('_', '-');
    const langVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').includes(langKey));
    const targets = activeHost.gender === 'female' ? ['sinji', 'tingting', 'ava'] : ['aasing', 'han', 'evan'];
    let selectedVoice = langVoices.find(v => targets.some(t => v.name.toLowerCase().includes(t))) || langVoices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = selectedLang;
    utterance.volume = isWarmup ? 0 : 1;
    if (!isWarmup) {
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleDisclaimerScroll = () => {
    if (disclaimerScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = disclaimerScrollRef.current;
      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 20) setHasScrolledToBottom(true);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    const cleanInput = removeEmojis(text);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: cleanInput, sender: 'user' }]);
    setText('');
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanInput, hostName: activeHost.label, language: selectedLang }),
      });
      const data = await response.json();
      const cleanReply = removeEmojis(data.reply);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: cleanReply, sender: 'ai' }]);
      speakLocally(cleanReply);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem('vibe_user_v3');
    if (saved) setUser(JSON.parse(saved)); else setActiveModal('login');
    const timer = setTimeout(() => speakLocally(" ", true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

  return (
    <main style={{ height: '100dvh', width: '100vw', background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', color: 'white' }}>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .nav-item { cursor: pointer; color: #94a3b8; transition: 0.2s; font-size: 14px; font-weight: 500; }
        .nav-item:hover { color: #6366f1; }
        .vibe-circle { width: 55px; height: 55px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid transparent; transition: 0.3s; }
        .vibe-circle.active { border-color: #22c55e; transform: scale(1.1); }
        .modal-input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; color: black; outline: none; font-size: 14px; box-sizing: border-box; }
      `}</style>

      {/* --- HEADER --- */}
      <header style={{ height: '60px', background: 'rgba(30, 41, 59, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '8px', display:'flex', alignItems:'center', justifyContent:'center' }}><Volume2 size={16}/></div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>VibeAiLink</span>
        </div>
        <nav style={{ display: 'flex', gap: '30px' }}>
          <span className="nav-item">{ui.about}</span><span className="nav-item">{ui.features}</span><span className="nav-item">{ui.pricing}</span>
        </nav>
        <div style={{ display: 'flex', gap: '10px', width: '250px', justifyContent: 'flex-end' }}>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', cursor:'pointer' }}>
            {metroDialects.map(d => <option key={d.code} value={d.code} style={{color:'black'}}>{d.label}</option>)}
          </select>
          <button onClick={() => setActiveModal('login')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{user ? ui.menu : ui.login}</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside style={{ width: '280px', background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
            {initialHosts.map(h => <img key={h.id} src={h.src} onClick={() => setActiveHost(h)} className={`vibe-circle ${activeHost.id === h.id ? 'active' : ''}`} />)}
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src={activeHost.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => setIsMuted(!isMuted)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '35px', height: '35px', color: 'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{ background: m.sender === 'user' ? '#6366f1' : 'rgba(255,255,255,0.06)', padding: '14px 20px', borderRadius: '18px' }}>{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <footer style={{ padding: '20px 30px' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto 20px', background: '#1e293b', padding: '10px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none' }}><Mic size={20}/></button>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={ui.placeholder} style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none' }} />
              <button onClick={handleSend} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#6366f1', border: 'none', color: 'white' }}><Send size={20}/></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <span className="nav-item" onClick={() => setActiveModal('contact')}>{ui.contact}</span>
              <span className="nav-item" onClick={() => { setHasScrolledToBottom(false); setActiveModal('disclaimer'); }}>{ui.disclaimer}</span>
              <span className="nav-item" onClick={() => setActiveModal('policy')}>{ui.policy}</span>
            </div>
          </footer>
        </section>
      </div>

      {/* --- MODALS --- */}
      {activeModal !== 'none' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
          {activeModal === 'login' && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '340px', display: 'flex', flexDirection: 'column', gap: '15px', color: '#000' }}>
              <h2 style={{ textAlign:'center', margin:0 }}>{ui.login}</h2>
              <input placeholder="Name" className="modal-input" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
              <input placeholder="Email" className="modal-input" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <button style={{ background: '#6366f1', color: 'white', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: 'bold' }} onClick={() => setActiveModal('disclaimer')}>{ui.next}</button>
            </div>
          )}

          {activeModal === 'disclaimer' && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '500px', height: '600px', maxHeight:'85vh', display: 'flex', flexDirection: 'column', color: '#000' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6366f1', marginBottom: '15px' }}><AlertTriangle size={24} /><h2 style={{ fontSize: '1.2rem', margin: 0 }}>{ui.disclaimerTitle}</h2></div>
              <div ref={disclaimerScrollRef} onScroll={handleDisclaimerScroll} style={{ overflowY: 'auto', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '2px solid #e2e8f0', marginBottom: '20px', flex: 1 }}>
                <p style={{ fontSize: '15px', lineHeight: '1.8' }}>{ui.disclaimerBody}<br/><br/>Email: dragongpai@gmail.com<br/><br/>(Scroll down to agree).<div style={{ height: '120px' }} /><p style={{ textAlign: 'center', color: '#cbd5e1' }}>--- END ---</p></p>
              </div>
              <button disabled={!hasScrolledToBottom} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', color: 'white', background: hasScrolledToBottom ? '#22c55e' : '#94a3b8', fontWeight:'bold' }} onClick={() => { setUser(authForm); localStorage.setItem('vibe_user_v3', JSON.stringify(authForm)); setActiveModal('none'); }}>{hasScrolledToBottom ? ui.accept : ui.scrollPrompt}</button>
            </div>
          )}

          {activeModal === 'policy' && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '400px', color: '#000' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', color:'#6366f1', marginBottom:'15px' }}><ShieldCheck size={24}/><h2>{ui.policyTitle}</h2></div>
              <div style={{ background:'#f8fafc', padding:'20px', borderRadius:'15px', border:'1px solid #e2e8f0', marginBottom:'20px', fontSize:'14px', whiteSpace: 'pre-line', lineHeight:'1.6' }}>{ui.policyBody}</div>
              <button onClick={() => alert("Unsubscribe request sent.")} style={{ width:'100%', padding:'12px', borderRadius:'12px', background:'#fee2e2', color:'#b91c1c', border:'none', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'10px' }}><CreditCard size={18}/> {ui.unsubBtn}</button>
              <button onClick={() => setActiveModal('none')} style={{ width:'100%', padding:'10px', borderRadius:'12px', border:'1px solid #cbd5e1', background:'white' }}>{ui.close}</button>
            </div>
          )}

          {activeModal === 'contact' && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '100%', maxWidth: '480px', margin: '0 20px', color: '#000', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6366f1', marginBottom: '20px' }}><Mail size={24} /><h2>{ui.contactTitle}</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder={ui.contactName} className="modal-input" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                <input placeholder={ui.contactEmail} className="modal-input" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                <textarea placeholder={ui.contactMsg} className="modal-input" style={{ height: '120px', resize: 'none' }} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white' }} onClick={() => setActiveModal('none')}>Cancel</button>
                <button style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#6366f1', color: 'white', border: 'none' }} onClick={() => { alert(ui.contactSuccess); setActiveModal('none'); }}>{ui.contactSend}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
