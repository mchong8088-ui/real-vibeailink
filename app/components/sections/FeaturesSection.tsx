import React from 'react';
import { 
  TrendingUp, 
  FileText, 
  Share2, 
  Volume2, 
  Languages, 
  LineChart, 
  Globe, 
  Smartphone, 
  Sparkles, 
  Shield,
  Video,
  FileAudio,
  Subtitles,
  Zap
} from 'lucide-react';

export const FeaturesSection = ({ lang }: { lang: string }) => {
  const isTraditional = lang === 'Traditional Chinese';
  const isSimplified = lang === 'Simplified Chinese';
  
  const getText = () => {
    if (isTraditional) {
      return {
        badge: '✨ 全新 AI 智能體驗',
        title: '智能分析 × 影音創作者工具',
        subtitle: '融合市場洞察與高效率 AI 媒體轉換，打造下一代數位生產力',
        categories: {
          media: '創作者影音工具',
          stock: 'AI 投資與市場洞察',
          core: '全球化與核心體驗'
        },
        features: [
          // New Features
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3 轉字幕影片', 
            desc: '自動將音訊轉換為高畫質動態影片，搭配自動化精準字幕生成。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)' 
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT 字幕生成與轉檔', 
            desc: '一鍵提取音訊字幕，支援多國語言 SRT 字幕導出與同步。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' 
          },
          // Original Stock Features
          { 
            category: 'stock',
            icon: <TrendingUp size={28} />, 
            title: '即時股票分析', 
            desc: '支援港股、台股、美股，秒級獲取技術指標與基本面數據。', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' 
          },
          { 
            category: 'stock',
            icon: <FileText size={28} />, 
            title: 'AI 新聞提煉', 
            desc: '貼上新聞連結，AI 自動摘要關鍵字並評估市場走勢影響。', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' 
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: '動態視覺圖表', 
            desc: '互動式價格趨勢圖與技術線圖，一目了然掌握市場脈動。', 
            gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' 
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI 信心評分', 
            desc: '0-100% 多維度風險評估與五星評分機制，輔助理性決策。', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' 
          },
          // Global & Experience Features
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: '多語音 AI 朗讀', 
            desc: '粵語、國語、普通話、英語自然語音，自由切換監聽。', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' 
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: '多國語言介面', 
            desc: '繁體中文、簡體中文、英文獨立控制，無縫全球運作。', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)' 
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: '多模型 AI 增強', 
            desc: '整合 OpenAI / Gemini / DeepSeek 多核心引擎深度分析。', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)' 
          },
        ],
        stats: [
          { value: 'AI+⚡', label: '雙引擎驅動' },
          { value: '4', label: '多國語音' },
          { value: '3', label: '全球市場' },
          { value: '100%', label: '自動化串流' },
        ],
        cta: '立即體驗全新功能',
      };
    } else if (isSimplified) {
      return {
        badge: '✨ 全新 AI 智能体验',
        title: '智能分析 × 影音创作者工具',
        subtitle: '融合市场洞察与高效率 AI 媒体转换，打造下一代数字生产力',
        categories: {
          media: '创作者影音工具',
          stock: 'AI 投资与市场洞察',
          core: '全球化与核心体验'
        },
        features: [
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3 转字幕视频', 
            desc: '自动将音频转换为高画质动态视频，搭配自动化精准字幕生成。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)' 
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT 字幕生成与转码', 
            desc: '一键提取音频字幕，支持多国语言 SRT 字幕导出与同步。', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' 
          },
          { 
            category: 'stock',
            icon: <TrendingUp size={28} />, 
            title: '实时股票分析', 
            desc: '支持港股、台股、美股，秒级获取技术指标与基本面数据。', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' 
          },
          { 
            category: 'stock',
            icon: <FileText size={28} />, 
            title: 'AI 新闻提炼', 
            desc: '粘贴新闻链接，AI 自动摘要关键词并评估市场走势影响。', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' 
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: '动态视觉图表', 
            desc: '互动式价格趋势图与技术线图，一目了然掌握市场脉动。', 
            gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' 
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI 信心评分', 
            desc: '0-100% 多维度风险评估与五星评分机制，辅助理性决策。', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' 
          },
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: '多语音 AI 朗读', 
            desc: '粤语、国语、普通话、英语自然语音，自由切换监听。', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' 
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: '多国语言界面', 
            desc: '繁体中文、简体中文、英文独立控制，无缝全球运作。', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)' 
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: '多模型 AI 增强', 
            desc: '整合 OpenAI / Gemini / DeepSeek 多核心引擎深度分析。', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)' 
          },
        ],
        stats: [
          { value: 'AI+⚡', label: '双引擎驱动' },
          { value: '4', label: '多国语音' },
          { value: '3', label: '全球市场' },
          { value: '100%', label: '自动化串流' },
        ],
        cta: '立即体验全新功能',
      };
    } else {
      return {
        badge: '✨ Next-Gen AI Hub',
        title: 'Market Intelligence × Creator Studio',
        subtitle: 'Combining real-time financial insights with automated video & audio production.',
        categories: {
          media: 'Creator Media Tools',
          stock: 'AI Market Intelligence',
          core: 'Global Experience'
        },
        features: [
          { 
            category: 'media',
            icon: <FileAudio size={28} />, 
            title: 'MP3 to Video Generator', 
            desc: 'Convert audio into dynamic video seamlessly with embedded subtitles.', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #FF007A 0%, #9300FF 100%)' 
          },
          { 
            category: 'media',
            icon: <Subtitles size={28} />, 
            title: 'SRT Subtitle Engine', 
            desc: 'Extract and sync multi-language subtitles automatically with high precision.', 
            badge: 'NEW',
            gradient: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' 
          },
          { 
            category: 'stock',
            icon: <TrendingUp size={28} />, 
            title: 'Real-Time Market Analytics', 
            desc: 'Instant technical and fundamental metrics for HK, TW, and US stocks.', 
            gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' 
          },
          { 
            category: 'stock',
            icon: <FileText size={28} />, 
            title: 'AI News Summarizer', 
            desc: 'Extract key market insights directly from news links with AI impact scoring.', 
            gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' 
          },
          { 
            category: 'stock',
            icon: <LineChart size={28} />, 
            title: 'Interactive Visuals', 
            desc: 'Clean, dynamic charts showing short-term and long-term price action.', 
            gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' 
          },
          { 
            category: 'stock',
            icon: <Shield size={28} />, 
            title: 'AI Confidence Score', 
            desc: 'Multi-variable risk evaluation rated from 0 to 100% for smarter decisions.', 
            gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' 
          },
          { 
            category: 'core',
            icon: <Volume2 size={28} />, 
            title: 'Multi-Voice Speech Synthesis', 
            desc: 'Seamless voiceovers available in Cantonese, Mandarin, Taiwanese, and English.', 
            gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' 
          },
          { 
            category: 'core',
            icon: <Languages size={28} />, 
            title: 'Multilingual UI', 
            desc: 'Independent control across Traditional Chinese, Simplified Chinese, and English.', 
            gradient: 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)' 
          },
          { 
            category: 'core',
            icon: <Sparkles size={28} />, 
            title: 'Multi-LLM Intelligence', 
            desc: 'Powered by dynamic OpenAI, Gemini, and DeepSeek integration.', 
            gradient: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)' 
          },
        ],
        stats: [
          { value: 'AI+⚡', label: 'Dual Engines' },
          { value: '4', label: 'Voices' },
          { value: '3', label: 'Global Markets' },
          { value: '100%', label: 'Automated Flow' },
        ],
        cta: 'Explore All Features',
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
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: '100px',
          background: 'rgba(147, 51, 234, 0.08)',
          color: '#9333EA',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          {text.badge}
        </span>
        <h2 style={{ 
          fontSize: '42px', 
          fontWeight: 900, 
          marginBottom: '16px',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 40%, #6B21A8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {text.title}
        </h2>
        <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
          {text.subtitle}
        </p>
      </div>

      {/* Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
        gap: '24px',
        marginBottom: '56px'
      }}>
        {text.features.map((feature, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '32px', 
              borderRadius: '28px', 
              background: feature.badge === 'NEW' 
                ? 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,243,255,0.8) 100%)' 
                : '#FFFFFF',
              border: feature.badge === 'NEW' ? '2px solid #C084FC' : '1px solid #F1F5F9',
              boxShadow: feature.badge === 'NEW'
                ? '0 20px 30px -10px rgba(147, 51, 234, 0.15)'
                : '0 10px 30px -10px rgba(0,0,0,0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 25px 35px -10px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = feature.badge === 'NEW'
                ? '0 20px 30px -10px rgba(147, 51, 234, 0.15)'
                : '0 10px 30px -10px rgba(0,0,0,0.04)';
            }}
          >
            {/* NEW Badge */}
            {feature.badge && (
              <span style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'linear-gradient(135deg, #FF007A, #9300FF)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '100px',
                boxShadow: '0 4px 10px rgba(255, 0, 122, 0.3)'
              }}>
                {feature.badge}
              </span>
            )}

            {/* Icon */}
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '18px', 
              background: feature.gradient,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '24px',
              color: 'white',
              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
            }}>
              {feature.icon}
            </div>

            {/* Feature Info */}
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#0F172A' }}>
              {feature.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '32px',
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '32px',
        textAlign: 'center',
        marginBottom: '48px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)'
      }}>
        {text.stats.map((stat, index) => (
          <div key={index}>
            <div style={{ fontSize: '38px', fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.5px' }}>{stat.value}</div>
            <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={navigateToAnalysis}
          style={{
            background: 'linear-gradient(135deg, #9333EA 0%, #2563EB 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '100px',
            padding: '16px 48px',
            fontSize: '17px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 28px -6px rgba(147, 51, 234, 0.4)',
            transition: 'all 0.2s ease'
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
          {text.cta} →
        </button>
      </div>

    </div>
  );
};