import React from 'react';
import { 
  Shield, 
  Brain, 
  Clock, 
  Zap, 
  Globe,
  Sparkles,
  Video,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AboutSection = ({ lang }: { lang: string }) => {
  const isTraditional = lang === 'Traditional Chinese';
  const isSimplified = lang === 'Simplified Chinese';
  
  const getText = () => {
    if (isTraditional) {
      return {
        badge1: '⚡ AI 雙引擎驅動',
        badge2: '🌐 全球化視野',
        badge3: '🎙️ 本地化多語音',
        title: '超越單一工具，打造下一代 AI 內容與智庫',
        quote: '「結合市場敬畏之心與高效率媒體自動化」',
        description: '我們經歷過網路時代的輝煌，現在正全速奔向 AI 革命。VibeAiLink 不僅為投資者提供秒級、零偏見的市場數據洞察，更融合強大的影音與字幕生成技術，讓複雜的數據與內容快速轉化為極具吸引力的媒體資產。',
        missionTitle: '我們的使命',
        missionDesc: '打破資訊不對稱與內容創作門檻。我們致力於將專業級的股市數據分析與自動化影音生產力相結合，讓每位使用者都能獲得真實、精準且可落地的數位優勢。',
        valuesHeader: '核心優勢與價值',
        values: [
          { 
            icon: <Shield size={24} />, 
            title: 'No Bias 零偏見分析', 
            desc: '客觀呈現真實數據，不受市場情緒干擾，提供純粹的決策依據。' 
          },
          { 
            icon: <Video size={24} />, 
            title: 'Creator Media 影音生成', 
            desc: '支援 MP3 轉影片與自動 SRT 字幕同步，秒級完成創作者媒體轉換。' 
          },
          { 
            icon: <Clock size={24} />, 
            title: 'Quick Insights 秒級洞察', 
            desc: '輸入代碼或新聞連結，5 秒內完成技術面與基本面綜合評估。' 
          },
          { 
            icon: <Cpu size={24} />, 
            title: 'Multi-LLM 引擎融合', 
            desc: '整合 OpenAI / Gemini / DeepSeek 多重大模型，確保精準度與深度。' 
          },
          { 
            icon: <Layers size={24} />, 
            title: 'Local Voice 本地語音', 
            desc: '內建國語、粵語、普通話及英語語音朗讀，自由聆聽市場脈動。' 
          },
          { 
            icon: <Globe size={24} />, 
            title: 'Multi-Market 全球覆蓋', 
            desc: '無縫涵蓋港股、台股與美股，具備國際化與在地化雙重視野。' 
          },
        ],
        stats: [
          { value: '3+', label: '全球覆蓋市場' },
          { value: '4', label: '多國語音朗讀' },
          { value: '<5s', label: '極速 AI 運算' },
          { value: '100%', label: '自動化串流' },
        ],
        ctaHeader: '準備好開啟高效率 AI 體驗了嗎？',
        ctaSub: '立即探索即時股票分析與影音創作者工具',
        cta: '立即開始體驗',
      };
    } else if (isSimplified) {
      return {
        badge1: '⚡ AI 双引擎驱动',
        badge2: '🌐 全球化视野',
        badge3: '🎙️ 本地化多语音',
        title: '超越单一工具，打造下一代 AI 内容与智库',
        quote: '「结合市场敬畏之心与高效率媒体自动化」',
        description: '我们经历过互联网时代的辉煌，现在正全速奔向 AI 革命。VibeAiLink 不仅为投资者提供秒级、零偏见的市场数据洞察，更融合强大的影音与字幕生成技术，让复杂的數據与内容快速转化为极具吸引力的媒体资产。',
        missionTitle: '我们的使命',
        missionDesc: '打破信息不对称与内容创作门槛。我们致力于将专业级的股市数据分析与自动化影音生产力相结合，让每位使用者都能获得真实、精准且可落地的数字优势。',
        valuesHeader: '核心优势与价值',
        values: [
          { 
            icon: <Shield size={24} />, 
            title: 'No Bias 零偏见分析', 
            desc: '客观呈现真实数据，不受市场情绪干扰，提供纯粹的决策依据。' 
          },
          { 
            icon: <Video size={24} />, 
            title: 'Creator Media 影音生成', 
            desc: '支持 MP3 转视频与自动 SRT 字幕同步，秒级完成创作者媒体转换。' 
          },
          { 
            icon: <Clock size={24} />, 
            title: 'Quick Insights 秒级洞察', 
            desc: '输入代码或新闻链接，5 秒内完成技术面与基本面综合评估。' 
          },
          { 
            icon: <Cpu size={24} />, 
            title: 'Multi-LLM 引擎融合', 
            desc: '整合 OpenAI / Gemini / DeepSeek 多重大模型，确保精准度与深度。' 
          },
          { 
            icon: <Layers size={24} />, 
            title: 'Local Voice 本地语音', 
            desc: '内置国语、粤语、普通话及英语语音朗读，自由聆听市场脉动。' 
          },
          { 
            icon: <Globe size={24} />, 
            title: 'Multi-Market 全球覆盖', 
            desc: '无缝涵盖港股、台股与美股，具备国际化与在地化双重视野。' 
          },
        ],
        stats: [
          { value: '3+', label: '全球覆盖市场' },
          { value: '4', label: '多国语音朗读' },
          { value: '<5s', label: '极速 AI 运算' },
          { value: '100%', label: '自动化串流' },
        ],
        ctaHeader: '准备好开启高效率 AI 体验了吗？',
        ctaSub: '立即探索实时股票分析与影音创作者工具',
        cta: '立即开始体验',
      };
    } else {
      return {
        badge1: '⚡ Dual AI Engines',
        badge2: '🌐 Global Reach',
        badge3: '🎙️ Multi-Voice TTS',
        title: 'Beyond Single Tools: The Next-Gen AI & Media Intelligence Hub',
        quote: '「Fusing market respect with high-efficiency media automation」',
        description: 'Having navigated the web era, we are now fully aligned with the AI revolution. VibeAiLink delivers unbiased market analytics and couples it with creator tools like audio-to-video processing and subtitle generation.',
        missionTitle: 'Our Mission',
        missionDesc: 'To eliminate information friction and lower the creative barrier. We bridge professional market intelligence with automated media workflows.',
        valuesHeader: 'Core Pillars & Values',
        values: [
          { 
            icon: <Shield size={24} />, 
            title: 'Zero Bias Analytics', 
            desc: 'Pure objective data without market noise or narrative distortion.' 
          },
          { 
            icon: <Video size={24} />, 
            title: 'Creator Media Engine', 
            desc: 'Seamless MP3-to-Video creation and automated SRT subtitle sync.' 
          },
          { 
            icon: <Clock size={24} />, 
            title: 'Sub-5s Intelligence', 
            desc: 'Instant technical analysis and news summarization in seconds.' 
          },
          { 
            icon: <Cpu size={24} />, 
            title: 'Multi-LLM Architecture', 
            desc: 'Harnessing OpenAI, Gemini, and DeepSeek models simultaneously.' 
          },
          { 
            icon: <Layers size={24} />, 
            title: 'Local Voice Synthesis', 
            desc: 'High-quality native voiceovers in Cantonese, Mandarin, and English.' 
          },
          { 
            icon: <Globe size={24} />, 
            title: 'Multi-Market Coverage', 
            desc: 'Complete technical metrics across Hong Kong, Taiwan, and US equities.' 
          },
        ],
        stats: [
          { value: '3+', label: 'Active Markets' },
          { value: '4', label: 'Voice Locales' },
          { value: '<5s', label: 'Processing Speed' },
          { value: '100%', label: 'Automated Flow' },
        ],
        ctaHeader: 'Ready to elevate your productivity?',
        ctaSub: 'Explore real-time analytics and creator tools right now.',
        cta: 'Get Started Now',
      };
    }
  };

  const text = getText();

  const navigateToAnalysis = () => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent || '';
      if (buttonText.includes('AI STOCK') || buttonText.includes('AI 股票') || buttonText.includes('AI股票')) {
        button.click();
        break;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1240px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Dark Modern Hero Block */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)', 
        padding: '72px 40px', 
        borderRadius: '36px', 
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
        marginBottom: '56px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(147, 51, 234, 0.2)', filter: 'blur(80px)' }} />

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <span style={{ padding: '6px 18px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.12)', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8' }}>
            {text.badge1}
          </span>
          <span style={{ padding: '6px 18px', borderRadius: '100px', background: 'rgba(168, 85, 247, 0.12)', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#C084FC' }}>
            {text.badge2}
          </span>
          <span style={{ padding: '6px 18px', borderRadius: '100px', background: 'rgba(34, 197, 94, 0.12)', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ADE80' }}>
            {text.badge3}
          </span>
        </div>

        {/* Hero Content */}
        <h2 style={{ 
          fontSize: '44px', 
          fontWeight: 900, 
          marginBottom: '20px', 
          textAlign: 'center', 
          letterSpacing: '-0.5px',
          lineHeight: '1.25',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #C084FC 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          maxWidth: '900px',
          margin: '0 auto 20px'
        }}>
          {text.title}
        </h2>
        
        <p style={{ fontSize: '20px', color: '#C084FC', fontStyle: 'italic', textAlign: 'center', marginBottom: '32px', fontWeight: 600 }}>
          {text.quote}
        </p>
        
        <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #38BDF8, #9333EA)', margin: '0 auto 32px', borderRadius: '100px' }} />
        
        <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#94A3B8', textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
          {text.description}
        </p>
      </div>

      {/* Mission Block */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '40px 32px',
        marginBottom: '56px',
        textAlign: 'center',
        border: '1px solid #F1F5F9',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={28} color="#9333EA" />
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{text.missionTitle}</h3>
        </div>
        <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#64748B', maxWidth: '720px', margin: '0 auto' }}>
          {text.missionDesc}
        </p>
      </div>

      {/* Values Grid */}
      <h3 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '40px', color: '#0F172A' }}>
        {text.valuesHeader}
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '24px',
        marginBottom: '56px'
      }}>
        {text.values.map((value, index) => (
          <div 
            key={index} 
            style={{
              padding: '32px',
              borderRadius: '24px',
              background: '#FFFFFF',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 35px -10px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'white',
              boxShadow: '0 8px 16px -4px rgba(79, 172, 254, 0.3)'
            }}>
              {value.icon}
            </div>
            <h4 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '10px', color: '#0F172A' }}>
              {value.title}
            </h4>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>
              {value.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Key Metrics Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '32px',
        padding: '40px',
        marginBottom: '56px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '32px',
        textAlign: 'center',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)'
      }}>
        {text.stats.map((stat, index) => (
          <div key={index}>
            <div style={{ fontSize: '40px', fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.5px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '6px', fontWeight: 600 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderRadius: '32px',
          padding: '48px 32px',
          textAlign: 'center',
          border: '1px solid #E2E8F0',
        }}
      >
        <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '10px', color: '#0F172A' }}>
          {text.ctaHeader}
        </h3>
        <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '28px' }}>
          {text.ctaSub}
        </p>
        <button
          onClick={navigateToAnalysis}
          style={{
            background: 'linear-gradient(135deg, #9333EA 0%, #2563EB 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '100px',
            padding: '16px 40px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 28px -6px rgba(147, 51, 234, 0.4)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 18px 36px -6px rgba(147, 51, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(147, 51, 234, 0.4)';
          }}
        >
          {text.cta} <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
};