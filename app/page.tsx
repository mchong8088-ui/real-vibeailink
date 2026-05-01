"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, Volume2, Square, Loader2, Send, Check } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { PriceChart } from './components/PriceChart';
import { footerContent } from './constants/content';
import { disclaimerData } from './constants/legal'; 

const navItems = [{ key: "關於我們", view: 'footer' }, { key: "功能介紹", view: 'footer' }, { key: "AI 分析", view: 'analysis' }, { key: "服務定價", view: 'pricing' }];
const t = {
  nav: { "關於我們": { "粵語 (繁體中文)": "關於我們", "简体中文": "关于我们", "English": "About Us" }, "功能介紹": { "粵語 (繁體中文)": "功能介紹", "简体中文": "关于介绍", "English": "Features" }, "服務定價": { "粵語 (繁體中文)": "服務定價", "简体中文": "服务定价", "English": "Pricing" }, "AI 分析": { "粵語 (繁體中文)": "AI 分析", "简体中文": "AI 分析", "English": "AI Analysis" } },
  languages: ["粵語 (繁體中文)", "简体中文", "English"]
};

export default function VibeAiMasterPage() {
  const [view, setView] = useState<'analysis' | 'pricing' | 'footer'>('analysis');
  const [activeFooterKey, setActiveFooterKey] = useState<string | null>(null);
  const [language, setLanguage] = useState('粵語 (繁體中文)');
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [technicalData, setTechnicalData] = useState<any>(null);
  const [speakerActive, setSpeakerActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [range, setRange] = useState('1mo');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const saved = localStorage.getItem('searchHistory');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const stopVoice = () => window.speechSynthesis.cancel();
  const speak = (text: string) => {
    if (!speakerActive || !text) return;
    const synth = window.speechSynthesis; synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'English' ? 'en-US' : (language === '简体中文' ? 'zh-CN' : 'zh-HK');
    synth.speak(u);
  };

  const handleAnalyze = async (overrideRange = range, symbol = input) => {
    if (!symbol.trim()) return; setIsProcessing(true);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: JSON.stringify({ symbol, lang: language, range: overrideRange }) });
      const data = await res.json();
      setAnalysisResult(data.summary); setTechnicalData(data.technicalCard); speak(data.summary);
      const newHistory = [symbol, ...searchHistory.filter(s => s !== symbol)].slice(0, 5);
      setSearchHistory(newHistory); localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } finally { setIsProcessing(false); }
  };

  const handleCheckout = async (planName: string) => {
    if (!user) { setIsAuthOpen(true); return; }
    const planMapping: Record<string, string> = { 'Pro Elite': 'pro', 'Institutional': 'inst' };
    const planKey = planMapping[planName];
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planKey, billingCycle }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error("Checkout error:", err); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: '70px', padding: '0 30px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Sparkles size={24} color="#2563eb" /> <span style={{ fontWeight: 900, fontSize: '20px' }}>VibeAiLink</span>
          <nav style={{ display: 'flex', gap: '20px', fontWeight: 600 }}>
            {navItems.map(item => <button key={item.key} onClick={() => { setActiveFooterKey(item.key); setView(item.view as any); }}>{t.nav[item.key as keyof typeof t.nav][language as any]}</button>)}
          </nav>
        </div>
        <div style={{display: 'flex', gap: '15px'}}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>{t.languages.map(l => <option key={l} value={l}>{l}</option>)}</select>
          <button onClick={() => user ? supabase.auth.signOut() : setIsAuthOpen(true)}>{user ? '登出' : '登入'}</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside style={{ width: '280px', padding: '24px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/avatars/michael_teresa.jpg" style={{ width: '120px', borderRadius: '50%' }} />
          <h3>Michael & Teresa</h3>
          <div style={{ width: '100%', marginTop: '30px' }}>
            {searchHistory.map(s => <button key={s} onClick={() => handleAnalyze('1mo', s)} style={{display:'block', width:'100%', background:'#fff9c4', padding:'8px', margin:'4px 0', border:'none', borderRadius:'4px', textAlign:'left'}}>{s}</button>)}
          </div>
        </aside>

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {view === 'analysis' ? (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {technicalData && (<><div style={{ marginBottom: '10px' }}>{['1mo', '3mo', '1y'].map(r => <button key={r} onClick={() => { setRange(r); handleAnalyze(r); }} style={{ marginRight: '10px', padding: '5px 10px', background: range === r ? '#e0e0e0' : 'none', borderRadius: '4px' }}>{r}</button>)}</div><PriceChart data={technicalData.history} /><Dashboard data={technicalData} /><div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '10px', marginTop: '10px' }}>{analysisResult}</div></>)}
              <div style={{ marginTop: '20px', background: '#f1f3f4', padding: '12px 20px', borderRadius: '24px', display: 'flex', alignItems:'center', gap:'12px' }}>
                <button><Mic color="red" /></button><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Insert symbol: 0700.HK, 2330.TW or TSLA" style={{flex:1, border:'none', background:'none', outline:'none'}} />
                <button onClick={() => setSpeakerActive(!speakerActive)}><Volume2 color="red" /></button><button onClick={stopVoice}><Square color="red" /></button><button onClick={() => handleAnalyze()} style={{ color: '#2563eb' }}>{isProcessing ? <Loader2 className="animate-spin" /> : <Send />}</button>
              </div>
            </div>
          ) : view === 'pricing' ? (
            <div style={{textAlign:'center', padding:'40px'}}>
               <h1>Choose Your Intelligence Engine</h1>
               <div style={{display:'flex', justifyContent:'center', gap:'20px', margin:'20px 0'}}>
                 <button onClick={() => setBillingCycle('monthly')} style={{fontWeight: billingCycle === 'monthly' ? 800 : 400}}>Monthly</button>
                 <button onClick={() => setBillingCycle('yearly')} style={{fontWeight: billingCycle === 'yearly' ? 800 : 400}}>Yearly (Save 20%)</button>
               </div>
               <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px'}}>
                 {[ { n: 'Explorer', p: '0' }, { n: 'Pro Elite', p: billingCycle === 'monthly' ? '29' : '23' }, { n: 'Institutional', p: billingCycle === 'monthly' ? '99' : '79' } ].map(plan => (
                   <div key={plan.n} style={{border:'1px solid #e0e0e0', padding:'30px', borderRadius:'16px'}}>
                     <h2>{plan.n}</h2><h1 style={{fontSize:'32px'}}>${plan.p}<span style={{fontSize:'14px'}}>/mo</span></h1>
                     <p style={{fontSize:'12px', color:'#666'}}>{plan.n === 'Explorer' ? 'Free 100 credits for new users' : 'AI驅動市場洞察，即時股票搜尋，多語音支援。'}</p>
                     <button onClick={() => plan.n === 'Explorer' ? (user ? setIsTopUpModalOpen(true) : setIsAuthOpen(true)) : handleCheckout(plan.n)} style={{background:'#2563eb', color:'white', padding:'10px 30px', borderRadius:'8px', width:'100%'}}>
                       {plan.n === 'Explorer' ? (user ? `Welcome Back, ${user.email.split('@')[0]}` : "Subscribe/Continue") : "Select Plan"}
                     </button>
                   </div>
                 ))}
               </div>
             </div>
          ) : (<div style={{whiteSpace:'pre-wrap', maxWidth: '800px', margin: '0 auto'}}>{activeFooterKey === "免責聲明" ? disclaimerData[language as any]?.content : footerContent[activeFooterKey as any]?.[language as any]}</div>)}
        </main>
      </div>

      {isTopUpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
            <h2>Coffee Plan - 輕鬆加值</h2>
            <p style={{ margin: '20px 0' }}>補充 100 點數，讓您的 AI 分析旅程不中斷。</p>
            <button onClick={async () => { const res = await fetch('/api/topup', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: user.email, amount: 5 }) }); const { url } = await res.json(); window.location.href = url; }} style={{ background: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '8px', width: '100%' }}>支付 $5 購買 Coffee Plan</button>
            <button onClick={() => setIsTopUpModalOpen(false)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#666' }}>關閉視窗</button>
          </div>
        </div>
      )}

      <footer style={{ padding: '20px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        {Object.keys(footerContent).map((key) => (
          <button key={key} onClick={() => { setActiveFooterKey(key); setView('footer'); }}>{t.nav[key as keyof typeof t.nav]?.[language as any] || key}</button>
        ))}
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onGoogleSignIn={() => supabase.auth.signInWithOAuth({ provider: 'google' })} />
    </div>
  );
}