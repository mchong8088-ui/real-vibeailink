import React from 'react';
import { Rocket, ShieldCheck, Heart } from 'lucide-react';

export const AboutSection = ({ lang }: { lang: string }) => {
  const content: any = {
    "粵語 (繁體中文)": {
      title: "我們不只是開發者",
      quote: "更是對市場充滿敬畏的長期玩家",
      description: "我們經歷過網路時代的輝煌，現在正全速奔向 AI 革命。VibeAiLink 誕生於一個單純的想法：讓資深投資者的智慧透過 AI 被無限放大。",
      badges: ["數據驅動", "全球視野", "三語支援"]
    }
  };
  const t = content[lang] || content["粵語 (繁體中文)"];

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        padding: '60px 40px', 
        borderRadius: '32px', 
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* 標籤置中 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          {t.badges.map((b: string) => (
            <span key={b} style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}>
              {b}
            </span>
          ))}
        </div>

        <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '20px', letterSpacing: '-1px' }}>{t.title}</h2>
        <p style={{ fontSize: '20px', color: '#7dd3fc', fontStyle: 'italic', marginBottom: '40px' }}>"{t.quote}"</p>
        
        <div style={{ width: '60px', height: '4px', background: '#3b82f6', margin: '0 auto 40px' }}></div>
        
        <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#cbd5e1', textAlign: 'left' }}>
          {t.description}
        </p>
      </div>
    </div>
  );
};