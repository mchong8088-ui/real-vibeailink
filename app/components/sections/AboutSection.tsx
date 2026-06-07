import React from 'react';
import { 
  Rocket, 
  Shield, 
  Brain, 
  Clock, 
  Zap, 
  Mic, 
  Globe,
  Sparkles
} from 'lucide-react';

export const AboutSection = ({ lang }: { lang: string }) => {
  const isChinese = lang === 'Traditional Chinese' || lang === 'Simplified Chinese';
  const isTraditional = lang === 'Traditional Chinese';
  
  const getText = () => {
    if (isTraditional) {
      return {
        title: '我們不只是開發者',
        quote: '「對市場永遠懷抱敬畏之心的長期玩家」',
        description: '我們經歷過網路時代的輝煌，現在正全速奔向 AI 革命。VibeAiLink 誕生於一個單純的想法：讓資深投資者的智慧透過 AI 被無限放大，讓每一位投資者都能獲得專業、即時、無偏見的分析。',
        mission: '我們的使命',
        missionDesc: '打破資訊不對稱，讓高品質的投資分析不再只是機構的專利。我們相信，每個人都有權利獲得真實、透明、即時的市場洞察。',
        values: [
          { icon: <Shield size={24} />, title: 'No Bias', desc: '零偏見分析，不受市場噪音影響，只呈現事實' },
          { icon: <Brain size={24} />, title: 'Honest Analysis', desc: '誠實面對每一個數據，不美化、不誇大、不誤導' },
          { icon: <Clock size={24} />, title: 'Quick Insights', desc: '輸入代碼，5秒內獲取完整技術與基本面分析' },
          { icon: <Zap size={24} />, title: 'Real-Time', desc: '即時市場數據，不錯過任何投資機會' },
          { icon: <Mic size={24} />, title: 'Voice Enabled', desc: '多語音選擇，用聽的也能掌握市場動態' },
          { icon: <Globe size={24} />, title: 'Multi-Market', desc: '支援港股、台股、美股，全球視野在地分析' },
        ],
        stats: [
          { value: '3', label: '市場覆蓋', suffix: '＋' },
          { value: '4', label: '語音選項', suffix: '' },
          { value: '<5', label: '秒級分析', suffix: 's' },
          { value: '100%', label: '無偏見', suffix: '' },
        ],
        cta: '立即開始分析',
        badge1: '數據驅動',
        badge2: '全球視野',
        badge3: '三語支援',
      };
    } else if (lang === 'Simplified Chinese') {
      return {
        title: '我们不只是开发者',
        quote: '「对市场永远怀有敬畏之心的长期玩家」',
        description: '我们经历过互联网时代的辉煌，现在正全速奔向 AI 革命。VibeAiLink 诞生于一个单纯的想法：让资深投资者的智慧通过 AI 被无限放大，让每一位投资者都能获得专业、即时、无偏见的分析。',
        mission: '我们的使命',
        missionDesc: '打破信息不对称，让高质量的投资分析不再只是机构的专利。我们相信，每个人都有权利获得真实、透明、即时的市场洞察。',
        values: [
          { icon: <Shield size={24} />, title: 'No Bias', desc: '零偏见分析，不受市场噪音影响，只呈现事实' },
          { icon: <Brain size={24} />, title: 'Honest Analysis', desc: '诚实面对每一个数据，不美化、不夸大、不误导' },
          { icon: <Clock size={24} />, title: 'Quick Insights', desc: '输入代码，5秒内获取完整技术与基本面分析' },
          { icon: <Zap size={24} />, title: 'Real-Time', desc: '实时市场数据，不错过任何投资机会' },
          { icon: <Mic size={24} />, title: 'Voice Enabled', desc: '多语音选择，用听也能掌握市场动态' },
          { icon: <Globe size={24} />, title: 'Multi-Market', desc: '支持港股、台股、美股，全球视野在地分析' },
        ],
        stats: [
          { value: '3', label: '市场覆盖', suffix: '＋' },
          { value: '4', label: '语音选项', suffix: '' },
          { value: '<5', label: '秒级分析', suffix: 's' },
          { value: '100%', label: '无偏见', suffix: '' },
        ],
        cta: '立即开始分析',
        badge1: '数据驱动',
        badge2: '全球视野',
        badge3: '三语支持',
      };
    } else {
      return {
        title: 'More Than Just Developers',
        quote: '「Long-term players with deep respect for the markets」',
        description: 'We\'ve witnessed the glory of the internet era, and now we\'re sprinting full speed toward the AI revolution. VibeAiLink was born from a simple idea: amplify the wisdom of seasoned investors through AI, making professional, real-time, unbiased analysis accessible to everyone.',
        mission: 'Our Mission',
        missionDesc: 'Break information asymmetry. High-quality investment analysis shouldn\'t be exclusive to institutions. We believe everyone deserves transparent, real-time, unbiased market insights.',
        values: [
          { icon: <Shield size={24} />, title: 'No Bias', desc: 'Zero-bias analysis,不受 market noise, only facts' },
          { icon: <Brain size={24} />, title: 'Honest Analysis', desc: 'Face every data point honestly, no美化, no exaggeration' },
          { icon: <Clock size={24} />, title: 'Quick Insights', desc: 'Enter ticker, get full technical & fundamental analysis in under 5 seconds' },
          { icon: <Zap size={24} />, title: 'Real-Time', desc: 'Real-time market data, never miss an opportunity' },
          { icon: <Mic size={24} />, title: 'Voice Enabled', desc: 'Multi-voice options, listen to market insights' },
          { icon: <Globe size={24} />, title: 'Multi-Market', desc: 'Support HK, TW, US markets, global perspective' },
        ],
        stats: [
          { value: '3', label: 'Markets', suffix: '+' },
          { value: '4', label: 'Voices', suffix: '' },
          { value: '<5', label: 'Second Analysis', suffix: 's' },
          { value: '100%', label: 'No Bias', suffix: '' },
        ],
        cta: 'Start Analysis Now',
        badge1: 'Data Driven',
        badge2: 'Global Vision',
        badge3: 'Multi-Lingual',
      };
    }
  };

  const text = getText();

  // Function to navigate to Analysis page
  const navigateToAnalysis = () => {
    // Find and click the analysis tab button
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent || '';
      if (buttonText === 'AI STOCK' || buttonText === 'AI 股票' || buttonText === 'AI股票') {
        button.click();
        break;
      }
    }
    // Also scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', 
        padding: '60px 40px', 
        borderRadius: '32px', 
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(168,85,247,0.1)', filter: 'blur(60px)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <span style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(59,130,246,0.2)', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(59,130,246,0.4)' }}>
            🚀 {text.badge1}
          </span>
          <span style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(168,85,247,0.2)', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(168,85,247,0.4)' }}>
            🌍 {text.badge2}
          </span>
          <span style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(34,197,94,0.2)', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(34,197,94,0.4)' }}>
            🗣️ {text.badge3}
          </span>
        </div>

        <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '20px', textAlign: 'center', letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {text.title}
        </h2>
        
        <p style={{ fontSize: '22px', color: '#c084fc', fontStyle: 'italic', textAlign: 'center', marginBottom: '40px' }}>
          {text.quote}
        </p>
        
        <div style={{ width: '80px', height: '4px', background: 'linear-gradient(90deg, #3b82f6, #a855f7)', margin: '0 auto 40px', borderRadius: '2px' }} />
        
        <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#cbd5e1', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          {text.description}
        </p>
      </div>

      {/* Mission Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '40px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Rocket size={32} color="#3b82f6" />
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>{text.mission}</h3>
        </div>
        <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#94a3b8', maxWidth: '700px', margin: '0 auto' }}>
          {text.missionDesc}
        </p>
      </div>

      {/* Values Grid */}
      <h3 style={{ fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '32px', color: '#1f2937' }}>
        ⚡ {isChinese ? '我們的核心價值' : 'Our Core Values'}
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        {text.values.map((value, index) => (
          <div key={index} style={{
            padding: '28px',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'white'
            }}>
              {value.icon}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>{value.title}</h4>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>{value.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '32px',
        padding: '48px 32px',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '32px',
        textAlign: 'center'
      }}>
        {text.stats.map((stat, index) => (
          <div key={index}>
            <div style={{ fontSize: '48px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
              {stat.value}{stat.suffix}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        border: '1px solid #e9d5ff',
        cursor: 'pointer'
      }}
      onClick={navigateToAnalysis}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}>
          {isChinese ? '準備好開始你的投資之旅了嗎？' : 'Ready to start your investment journey?'}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
          {isChinese ? '輸入股票代號，5秒內獲得專業分析' : 'Enter a ticker, get professional analysis in under 5 seconds'}
        </p>
        <button
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '60px',
            padding: '12px 32px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {text.cta} →
        </button>
      </div>
    </div>
  );
};