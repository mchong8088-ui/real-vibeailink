"use client";
import React, { useMemo, useState } from 'react';
import { PriceChart } from './PriceChart';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
  onAnalyze?: (ticker: string, attachments?: any[], useAI?: boolean) => void;
  voiceLanguage?: string;
}

// Share Buttons Component
const ShareButtons = ({ data, langKey }: { data: any; langKey: string }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const generateShareText = () => {
    // Use the full analysis text from data.summary
    let analysisText = data.summary || '';
    
    // If summary is not available, generate fallback
    if (!analysisText || analysisText.length < 100) {
      const isPositive = data.changePercent > 0;
      const sentiment = isPositive ? '🚀' : '📉';
      const changeText = `${isPositive ? '+' : ''}${data.changePercent?.toFixed(2)}%`;
      const companyName = data.companyName || data.symbol;
      
      analysisText = `${sentiment} ${companyName} ${data.currency || '$'}${data.price} (${changeText})
      
Full analysis: vibeailink.com`;
    }
    
    if (shareMessage.trim()) {
      return `${shareMessage.trim()}\n\n${analysisText}`;
    }
    return analysisText;
  };

  const shareText = generateShareText();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToFacebook = () => {
    navigator.clipboard.writeText(shareText);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText.substring(0, 300))}`, '_blank', 'width=600,height=400');
    setTimeout(() => {
      alert(langKey === 'Traditional Chinese' ? '分析內容已複製，可貼上到Facebook！' : langKey === 'Simplified Chinese' ? '分析内容已复制，可粘贴到Facebook！' : 'Analysis copied! You can paste it on Facebook.');
    }, 100);
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.substring(0, 240))}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const whatsappText = `${shareText}\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
  };

  const copyToClipboard = () => {
    const textToCopy = `${shareText}\n\n${shareUrl}`;
    navigator.clipboard.writeText(textToCopy);
    alert(langKey === 'Traditional Chinese' ? '已複製到剪貼板！' : langKey === 'Simplified Chinese' ? '已复制到剪贴板！' : 'Copied to clipboard!');
  };

  const downloadAsImage = () => {
    alert(langKey === 'Traditional Chinese' ? '截圖功能：請使用瀏覽器截圖工具' : langKey === 'Simplified Chinese' ? '截图功能：请使用浏览器截图工具' : 'Screenshot: Please use browser screenshot tool');
  };

  const shareButtons = [
    { icon: '📘', label: 'Facebook', onClick: shareToFacebook, color: '#1877F2' },
    { icon: '🐦', label: 'Twitter', onClick: shareToTwitter, color: '#1DA1F2' },
    { icon: '🔗', label: 'LinkedIn', onClick: shareToLinkedIn, color: '#0077B5' },
    { icon: '📱', label: 'WhatsApp', onClick: shareToWhatsApp, color: '#25D366' },
    { icon: '📋', label: langKey === 'Traditional Chinese' ? '複製連結' : langKey === 'Simplified Chinese' ? '复制链接' : 'Copy Link', onClick: copyToClipboard, color: '#6B7280' },
    { icon: '📸', label: langKey === 'Traditional Chinese' ? '截圖' : langKey === 'Simplified Chinese' ? '截图' : 'Screenshot', onClick: downloadAsImage, color: '#8B5CF6' },
  ];

  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
          📤 {langKey === 'Traditional Chinese' ? '分享分析報告' : langKey === 'Simplified Chinese' ? '分享分析报告' : 'Share Analysis'}
        </span>
        <button onClick={() => setShowShareMenu(!showShareMenu)} style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {showShareMenu ? '▼' : '▶'} {langKey === 'Traditional Chinese' ? '分享選項' : langKey === 'Simplified Chinese' ? '分享选项' : 'Share Options'}
        </button>
      </div>
      
      {showShareMenu && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
              {langKey === 'Traditional Chinese' ? '添加您的評論 (可選)' : 
               langKey === 'Simplified Chinese' ? '添加您的评论 (可选)' : 
               'Add your message (optional)'}
            </label>
            <textarea
              placeholder={langKey === 'Traditional Chinese' ? '例如：Time to BUY or Sell this week? 本週是買入還是賣出時機？' : 
                          langKey === 'Simplified Chinese' ? '例如：Time to BUY or Sell this week? 本周是买入还是卖出时机？' :
                          'E.g.: Time to BUY or Sell this week?'}
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '11px',
                resize: 'vertical',
                minHeight: '50px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {shareButtons.map((btn, idx) => (
              <button key={idx} onClick={btn.onClick} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: btn.color, color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t, onAnalyze }) => {
  // Get language-specific text for UI
  const getUIText = () => {
    if (langKey === 'Traditional Chinese') {
      return {
        globalIndicesTitle: '全球市場指數',
        priceChartTitle: '價格走勢圖 (最近3個月)',
        range: '區間',
        dataPeriod: '數據期間',
        last90Days: '最近90天',
        loadingChart: '圖表數據載入中...',
        noData: '輸入股票代號開始分析',
        analyzing: '分析中...'
      };
    } else if (langKey === 'Simplified Chinese') {
      return {
        globalIndicesTitle: '全球市场指数',
        priceChartTitle: '价格走势图 (最近3个月)',
        range: '区间',
        dataPeriod: '数据期间',
        last90Days: '最近90天',
        loadingChart: '图表数据加载中...',
        noData: '输入股票代码开始分析',
        analyzing: '分析中...'
      };
    } else {
      return {
        globalIndicesTitle: 'Global Market Indices',
        priceChartTitle: 'Price Chart (Last 3 Months)',
        range: 'Range',
        dataPeriod: 'Data Period',
        last90Days: 'Last 90 Days',
        loadingChart: 'Loading chart data...',
        noData: 'Enter stock symbol to start analysis',
        analyzing: 'Analyzing...'
      };
    }
  };

  const uiText = getUIText();

  const globalIndices = [
    { name: "S&P 500", value: "5,234.18", change: "+0.8%", positive: true },
    { name: "NASDAQ", value: "16,428.82", change: "+1.2%", positive: true },
    { name: "DAX", value: "18,456.32", change: "-0.3%", positive: false },
    { name: "HSI", value: "19,234.56", change: "+0.5%", positive: true },
    { name: "Nikkei 225", value: "38,234.12", change: "-0.7%", positive: false },
    { name: "FTSE 100", value: "7,845.67", change: "+0.2%", positive: true },
  ];

  const row1Indices = globalIndices.slice(0, 3);
  const row2Indices = globalIndices.slice(3, 6);

  // Prepare chart data
  const chartData = useMemo(() => {
    const historical = data?.historical;
    if (!historical || historical.length === 0) {
      return [];
    }
    
    // Take last 90 days of data (about 3 months)
    const threeMonthsData = historical.slice(-90);
    
    return threeMonthsData.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      price: item.close,
      close: item.close,
    }));
  }, [data?.historical]);

  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ color: '#6B7280' }}>{uiText.analyzing}</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF' }}>{uiText.noData}</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>例如: 2330.TW, 0700.HK, TSLA</p>
      </div>
    );
  }

  const isPositive = data.changePercent > 0;
  const priceDisplay = data.price ? `${data.price.toFixed(2)}` : 'N/A';
  const changeDisplay = data.changePercent ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : 'N/A';
  const rsiDisplay = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  
  const getChineseText = (text: string): string => {
    if (langKey === 'Traditional Chinese' || langKey === 'Simplified Chinese') {
      const translations: Record<string, string> = {
        'Bullish': '看好',
        'Bearish': '看淡',
        'Neutral': '中性',
        'Uptrend': '上升通道',
        'Downtrend': '下降通道',
        'Sideways': '區間震盪',
      };
      return translations[text] || text;
    }
    return text;
  };
  
  const macdDisplay = (langKey === 'Traditional Chinese' || langKey === 'Simplified Chinese') ? getChineseText(data.macd || 'Neutral') : (data.macd || 'Neutral');
  const trendDisplay = (langKey === 'Traditional Chinese' || langKey === 'Simplified Chinese') ? getChineseText(data.trend || 'Sideways') : (data.trend || 'Sideways');
  
  const getCurrencySymbol = () => {
    if (data.symbol?.endsWith('.TW')) return 'NT$';
    if (data.symbol?.endsWith('.HK')) return 'HK$';
    return '$';
  };
  const currencySymbol = getCurrencySymbol();

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : 0;

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Global Market Indices */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px' }}>🌍</span>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>{uiText.globalIndicesTitle}</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {row1Indices.map((idx, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{idx.name}</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{idx.value}</p>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '2px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {row2Indices.map((idx, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{idx.name}</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{idx.value}</p>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '2px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Info Bar */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#3B82F6', padding: '6px', borderRadius: '8px' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>📊</span>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{data.symbol}</h3>
              {data.companyName && <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{data.companyName}</p>}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444' }}>{changeDisplay}</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{langKey === 'Traditional Chinese' || langKey === 'Simplified Chinese' ? '股價' : 'Price'}</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{currencySymbol}{priceDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>RSI(14)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{rsiDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>MACD</p>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: data.macd === 'Bullish' ? '#10B981' : data.macd === 'Bearish' ? '#EF4444' : '#6B7280' }}>
                {macdDisplay}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{langKey === 'Traditional Chinese' || langKey === 'Simplified Chinese' ? '趨勢' : 'Trend'}</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {data.trend === 'Uptrend' ? '📈' : data.trend === 'Downtrend' ? '📉' : '➡️'} {trendDisplay}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart data={chartData} langKey={langKey} />

      {/* Analysis Report */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>{data.summary}</div>
        
        {/* Share Buttons */}
        <ShareButtons data={data} langKey={langKey} />
        
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>AI Analysis by vibeailink.com • {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};