"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { PriceChart } from './PriceChart';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
  onAnalyze?: (ticker: string, attachments?: any[], useAI?: boolean) => void;
  voiceLanguage?: string;
  user?: any;
  profile?: any;
  onUpgradePlan?: () => void;
}

// Facebook Login Component
const FacebookLoginButton = ({ onLogin, langKey }: { onLogin: (token: string) => void; langKey: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID || 'YOUR_APP_ID',
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleLogin = () => {
    if (typeof window === 'undefined' || !window.FB) {
      alert(langKey === 'Traditional Chinese' ? 'Facebook SDK 載入中，請稍後再試' :
            langKey === 'Simplified Chinese' ? 'Facebook SDK 加载中，请稍后再试' :
            'Facebook SDK is loading, please try again later');
      return;
    }

    setIsLoading(true);
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem('fb_access_token', token);
        onLogin(token);
      } else {
        alert(langKey === 'Traditional Chinese' ? 'Facebook 登入失敗' :
              langKey === 'Simplified Chinese' ? 'Facebook 登录失败' :
              'Facebook login failed');
      }
      setIsLoading(false);
    }, { scope: 'public_profile,email' });
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#1877F2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '11px',
        fontWeight: '500',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? (
        <>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>{langKey === 'Traditional Chinese' ? '登入中...' : langKey === 'Simplified Chinese' ? '登录中...' : 'Logging in...'}</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
          </svg>
          <span>{langKey === 'Traditional Chinese' ? 'Facebook 登入' : langKey === 'Simplified Chinese' ? 'Facebook 登录' : 'Facebook Login'}</span>
        </>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

// Facebook API Share Button Component
const FacebookAPIShareButton = ({ 
  accessToken, 
  symbol, 
  reportContent, 
  reportUrl, 
  langKey,
  onSuccess,
  onError 
}: { 
  accessToken: string;
  symbol: string;
  reportContent: string;
  reportUrl: string;
  langKey: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const getShareMessage = () => {
    const baseMessage = shareMessage.trim() ? shareMessage.trim() : '';
    const analysisPreview = reportContent.substring(0, 300);
    
    if (baseMessage) {
      return `${baseMessage}\n\n📊 ${symbol} Analysis:\n${analysisPreview}...`;
    }
    return `📊 ${symbol} Analysis Report\n\n${analysisPreview}...`;
  };

  const handleShare = async () => {
    if (!accessToken) {
      onError?.(langKey === 'Traditional Chinese' ? '請先登入 Facebook' :
                 langKey === 'Simplified Chinese' ? '请先登录 Facebook' :
                 'Please login to Facebook first');
      return;
    }

    setIsSharing(true);

    try {
      const response = await fetch('/api/facebook/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken,
          message: getShareMessage(),
          link: reportUrl,
          symbol: symbol,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = langKey === 'Traditional Chinese' ? '✅ 成功分享到 Facebook！' :
                          langKey === 'Simplified Chinese' ? '✅ 成功分享到 Facebook！' :
                          '✅ Successfully shared to Facebook!';
        alert(successMsg);
        setShareMessage('');
        onSuccess?.();
      } else {
        throw new Error(data.error || 'Share failed');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      const errorMsg = langKey === 'Traditional Chinese' ? '分享失敗，請稍後再試' :
                       langKey === 'Simplified Chinese' ? '分享失败，请稍后再试' :
                       'Share failed, please try again later';
      onError?.(errorMsg);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <label style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
        {langKey === 'Traditional Chinese' ? '添加您的評論 (可選)' : 
         langKey === 'Simplified Chinese' ? '添加您的评论 (可选)' : 
         'Add your message (optional)'}
      </label>
      <textarea
        placeholder={langKey === 'Traditional Chinese' ? '例如：Time to BUY or Sell this week?' : 
                    langKey === 'Simplified Chinese' ? '例如：Time to BUY or Sell this week?' :
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
          boxSizing: 'border-box',
          marginBottom: '8px',
        }}
      />
      <button
        onClick={handleShare}
        disabled={isSharing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 16px',
          backgroundColor: '#1877F2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSharing ? 'not-allowed' : 'pointer',
          opacity: isSharing ? 0.6 : 1,
          fontSize: '13px',
          fontWeight: '500',
        }}
      >
        {isSharing ? (
          <>
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span>{langKey === 'Traditional Chinese' ? '分享中...' : langKey === 'Simplified Chinese' ? '分享中...' : 'Sharing...'}</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
            </svg>
            <span>{langKey === 'Traditional Chinese' ? '一鍵分享到 Facebook' : langKey === 'Simplified Chinese' ? '一键分享到 Facebook' : 'Share to Facebook'}</span>
          </>
        )}
      </button>
    </div>
  );
};

// Share Buttons Component
const ShareButtons = ({ data, langKey }: { data: any; langKey: string }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [fbAccessToken, setFbAccessToken] = useState<string | null>(null);
  const [showFbLogin, setShowFbLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fb_access_token');
    if (token) {
      setFbAccessToken(token);
    }
  }, []);

  const generateShareText = () => {
    let analysisText = data.summary || '';
    
    if (!analysisText || analysisText.length < 100) {
      const isPositive = data.changePercent > 0;
      const sentiment = isPositive ? '🚀' : '📉';
      const changeText = `${isPositive ? '+' : ''}${data.changePercent?.toFixed(2)}%`;
      const companyName = data.companyName || data.symbol;
      
      analysisText = `${sentiment} ${companyName} ${data.currency || '$'}${data.price} (${changeText})\n\nFull analysis: vibeailink.com`;
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

  const handleFbLoginSuccess = (token: string) => {
    setFbAccessToken(token);
    setShowFbLogin(false);
    alert(langKey === 'Traditional Chinese' ? 'Facebook 帳號已連接！' :
          langKey === 'Simplified Chinese' ? 'Facebook 账号已连接！' :
          'Facebook account connected!');
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
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {shareButtons.map((btn, idx) => (
              <button key={idx} onClick={btn.onClick} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: btn.color, color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
          </div>

          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px dashed #E5E7EB',
            backgroundColor: '#F0F9FF',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1877F2' }}>
                🤖 {langKey === 'Traditional Chinese' ? '自動發帖模式' : langKey === 'Simplified Chinese' ? '自动发帖模式' : 'Auto-Post Mode'}
              </span>
              <span style={{ fontSize: '9px', color: '#6B7280' }}>
                {langKey === 'Traditional Chinese' ? '(需 Facebook 授權)' : langKey === 'Simplified Chinese' ? '(需 Facebook 授权)' : '(Facebook authorization required)'}
              </span>
            </div>

            {fbAccessToken ? (
              <FacebookAPIShareButton
                accessToken={fbAccessToken}
                symbol={data.symbol}
                reportContent={data.summary || ''}
                reportUrl={shareUrl}
                langKey={langKey}
                onSuccess={() => console.log('Share success')}
                onError={(error) => alert(error)}
              />
            ) : showFbLogin ? (
              <div>
                <FacebookLoginButton onLogin={handleFbLoginSuccess} langKey={langKey} />
                <button
                  onClick={() => setShowFbLogin(false)}
                  style={{ marginTop: '8px', fontSize: '10px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {langKey === 'Traditional Chinese' ? '取消' : langKey === 'Simplified Chinese' ? '取消' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFbLogin(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#E8F0FE',
                  color: '#1877F2',
                  border: '1px solid #1877F2',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
                <span>{langKey === 'Traditional Chinese' ? '連接 Facebook 以啟用一鍵發帖' : langKey === 'Simplified Chinese' ? '连接 Facebook 以启用一键发帖' : 'Connect Facebook to enable one-click posting'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const StockAnalysisModule: React.FC<Props> = ({ 
  data, 
  isLoading, 
  langKey, 
  t, 
  onAnalyze,
  user,
  profile,
  onUpgradePlan 
}) => {
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);
  
  // Add to watchlist function
const addToWatchlist = () => {
  const symbol = analysisData?.symbol;
  if (!symbol) return;
  
  const saved = localStorage.getItem('stockWatchlist');
  let watchlist: string[] = saved ? JSON.parse(saved) : [];
  
  if (watchlist.includes(symbol)) {
    alert(`⚠️ ${symbol} is already in your watchlist!`);
    return;
  }
  
  if (watchlist.length >= 10) {
    alert(`⚠️ Watchlist limit reached (max 10 stocks).`);
    return;
  }
  
  watchlist.push(symbol);
  localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
  alert(`✅ ${symbol} added to your watchlist!`);
};
  
  // Credit check for desktop users
  if (user && profile && profile.credits <= 0 && !isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#DC2626', marginBottom: '16px' }}>
          {langKey === 'Traditional Chinese' ? '沒有足夠積分' : 
           langKey === 'Simplified Chinese' ? '没有足够积分' : 
           'Insufficient Credits'}
        </h3>
        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
          {langKey === 'Traditional Chinese' ? '您已經用完所有積分。請升級計劃以繼續使用。' : 
           langKey === 'Simplified Chinese' ? '您已经用完所有积分。请升级计划以继续使用。' : 
           'You have used all your credits. Please upgrade your plan to continue.'}
        </p>
        <button 
          onClick={onUpgradePlan}
          style={{
            backgroundColor: '#22C55E',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {langKey === 'Traditional Chinese' ? '升級計劃' : 
           langKey === 'Simplified Chinese' ? '升级计划' : 
           'Upgrade Plan'}
        </button>
      </div>
    );
  }

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
        {/* Add to Watchlist Button */}
        {/* Add to Watchlist Button */}
{data?.symbol && user && (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'flex-end',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E5E7EB'
  }}>
    <button
      onClick={addToWatchlist}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        border: '1px solid #FDE68A',
        borderRadius: '40px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#FDE68A';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FEF3C7';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '16px' }}>⭐</span>
      Add {data.symbol} to Watchlist
    </button>
  </div>
)}
        
        {/* Watchlist Message */}
        {watchlistMessage && (
          <div style={{
            marginBottom: '16px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: watchlistMessage.includes('✅') ? '#ECFDF5' : '#FEF2F2',
            color: watchlistMessage.includes('✅') ? '#10B981' : '#EF4444',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {watchlistMessage}
          </div>
        )}
        
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