import React from 'react';
import { 
  TrendingUp, 
  Briefcase, 
  Share2, 
  Volume2, 
  Languages, 
  LineChart, 
  Globe, 
  Smartphone, 
  Sparkles, 
  Shield
} from 'lucide-react';

export const FeaturesSection = ({ lang }: { lang: string }) => {
  const isChinese = lang === 'Traditional Chinese' || lang === 'Simplified Chinese';
  const isTraditional = lang === 'Traditional Chinese';
  const isSimplified = lang === 'Simplified Chinese';
  
  const getText = () => {
    if (isTraditional) {
      return {
        title: 'AI 驅動，全方位投資分析',
        subtitle: '讓每一次決策都更有信心',
        features: [
          { icon: <TrendingUp size={32} />, title: '即時股票分析', desc: '支援港股、台股、美股，秒級獲取技術指標與基本面數據', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { icon: <Briefcase size={32} />, title: '投資組合追蹤', desc: '輕鬆管理持股，實時計算盈虧，數據保存在本地', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
          { icon: <Share2 size={32} />, title: '一鍵分享', desc: '支援 Facebook、Twitter、LinkedIn、WhatsApp，分享你的分析見解', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          { icon: <Volume2 size={32} />, title: '多語音選擇', desc: '粵語、普通話、國語、英語四種語音，自由切換', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
          { icon: <Languages size={32} />, title: '三語文字介面', desc: '繁體中文、簡體中文、英文，文字與語音獨立控制', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
          { icon: <LineChart size={32} />, title: '專業圖表', desc: '3個月價格走勢圖，一目了然掌握股價趨勢', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
          { icon: <Globe size={32} />, title: '全球市場指數', desc: '即時追蹤 S&P 500、NASDAQ、HSI 等主要指數', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
          { icon: <Smartphone size={32} />, title: '手機完美適配', desc: '桌面版與手機版功能完全同步，隨時隨地分析', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
          { icon: <Sparkles size={32} />, title: 'AI 智能增強', desc: '可選 OpenAI/Gemini/DeepSeek 增強分析，更深入洞察', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
          { icon: <Shield size={32} />, title: '信心評分系統', desc: '0-100% 信心評分，五星級評價，客觀評估風險', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
        ],
        stats: [
          { value: '10+', label: '核心功能' },
          { value: '4', label: '語音選項' },
          { value: '3', label: '文字語言' },
          { value: '3', label: '市場支援' },
        ],
        cta: '立即開始分析',
      };
    } else if (isSimplified) {
      return {
        title: 'AI 驱动，全方位投资分析',
        subtitle: '让每一次决策都更有信心',
        features: [
          { icon: <TrendingUp size={32} />, title: '实时股票分析', desc: '支持港股、台股、美股，秒级获取技术指标与基本面数据', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { icon: <Briefcase size={32} />, title: '投资组合追踪', desc: '轻松管理持股，实时计算盈亏，数据保存在本地', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
          { icon: <Share2 size={32} />, title: '一键分享', desc: '支持 Facebook、Twitter、LinkedIn、WhatsApp，分享你的分析见解', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          { icon: <Volume2 size={32} />, title: '多语音选择', desc: '粤语、普通话、国语、英语四种语音，自由切换', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
          { icon: <Languages size={32} />, title: '三语文字界面', desc: '繁体中文、简体中文、英文，文字与语音独立控制', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
          { icon: <LineChart size={32} />, title: '专业图表', desc: '3个月价格走势图，一目了然掌握股价趋势', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
          { icon: <Globe size={32} />, title: '全球市场指数', desc: '实时追踪 S&P 500、NASDAQ、HSI 等主要指数', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
          { icon: <Smartphone size={32} />, title: '手机完美适配', desc: '桌面版与手机版功能完全同步，随时随地分析', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
          { icon: <Sparkles size={32} />, title: 'AI 智能增强', desc: '可选 OpenAI/Gemini/DeepSeek 增强分析，更深入洞察', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
          { icon: <Shield size={32} />, title: '信心评分系统', desc: '0-100% 信心评分，五星级评价，客观评估风险', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
        ],
        stats: [
          { value: '10+', label: '核心功能' },
          { value: '4', label: '语音选项' },
          { value: '3', label: '文字语言' },
          { value: '3', label: '市场支持' },
        ],
        cta: '立即开始分析',
      };
    } else {
      return {
        title: 'AI-Powered Investment Analysis',
        subtitle: 'Every decision with greater confidence',
        features: [
          { icon: <TrendingUp size={32} />, title: 'Real-Time Stock Analysis', desc: 'Support HK, TW, US markets. Get technical indicators & fundamentals instantly', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { icon: <Briefcase size={32} />, title: 'Portfolio Tracker', desc: 'Easily manage holdings, real-time P&L calculation, local storage', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
          { icon: <Share2 size={32} />, title: 'One-Click Share', desc: 'Share to Facebook, Twitter, LinkedIn, WhatsApp', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          { icon: <Volume2 size={32} />, title: 'Multi-Voice Selection', desc: 'Cantonese, Mandarin, Taiwanese Mandarin, English - freely switch', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
          { icon: <Languages size={32} />, title: 'Multi-Language UI', desc: 'Traditional Chinese, Simplified Chinese, English - independent control', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
          { icon: <LineChart size={32} />, title: 'Professional Charts', desc: '3-month price chart, clear trend visualization', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
          { icon: <Globe size={32} />, title: 'Global Market Indices', desc: 'Real-time tracking of S&P 500, NASDAQ, HSI, etc.', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
          { icon: <Smartphone size={32} />, title: 'Fully Responsive', desc: 'Desktop & mobile with full feature parity', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
          { icon: <Sparkles size={32} />, title: 'AI Enhancement', desc: 'Optional OpenAI/Gemini/DeepSeek for deeper insights', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
          { icon: <Shield size={32} />, title: 'Confidence Scoring', desc: '0-100% confidence score with 5-star rating system', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
        ],
        stats: [
          { value: '10+', label: 'Core Features' },
          { value: '4', label: 'Voice Options' },
          { value: '3', label: 'Text Languages' },
          { value: '3', label: 'Markets' },
        ],
        cta: 'Start Analysis Now',
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
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '36px', 
          fontWeight: 900, 
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed, #db2777)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {text.title}
        </h2>
        <p style={{ fontSize: '16px', color: '#6B7280' }}>{text.subtitle}</p>
      </div>

      {/* Features Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {text.features.map((feature, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '28px', 
              borderRadius: '24px', 
              background: 'white', 
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: feature.gradient,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '20px',
              color: 'white'
            }}>
              {feature.icon}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: '#1F2937' }}>
              {feature.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '32px',
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '24px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        {text.stats.map((stat, index) => (
          <div key={index}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#60A5FA' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={navigateToAnalysis}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '60px',
            padding: '14px 40px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37,99,235,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37,99,235,0.3)';
          }}
        >
          {text.cta} →
        </button>
      </div>
    </div>
  );
};