import React from 'react';
import { Zap, BarChart3, Languages, Target } from 'lucide-react';

export const FeaturesSection = ({ lang }: { lang: string }) => {
  const features = [
    { icon: <Zap size={32} color="#3b82f6" />, title: "瞬時洞察", desc: "秒級掃描全球資訊，將雜訊轉化為可執行的獲利信號。", bg: '#eff6ff' },
    { icon: <Target size={32} color="#a855f7" />, title: "精準掃描", desc: "輸入代碼，AI 立即為您執行深度技術面與基本面解析。", bg: '#f5f3ff' },
    { icon: <BarChart3 size={32} color="#10b981" />, title: "視覺化情報", desc: "不只是數字，我們用圖表說故事，看穿市場情緒波動。", bg: '#ecfdf5' },
    { icon: <Languages size={32} color="#f59e0b" />, title: "三語平權", desc: "支援粵語、普通話及英語，無障礙對接國際市場動態。", bg: '#fffbeb' }
  ];

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 900, marginBottom: '40px', background: 'linear-gradient(90deg, #2563eb, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        AI 驅動，精準掌握
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {features.map((f, i) => (
          <div key={i} style={{ 
            padding: '30px', 
            borderRadius: '24px', 
            background: 'white', 
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>{f.title}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};