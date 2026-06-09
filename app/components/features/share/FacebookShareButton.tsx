// app/components/features/share/FacebookShareButton.tsx
"use client";
import React, { useState } from 'react';

interface FacebookShareButtonProps {
  accessToken: string;      // 用戶的 Facebook token
  symbol: string;           // 股票代號 e.g., 2330.tw
  reportContent: string;    // 分析報告內容
  reportUrl: string;        // 報告的完整網址
  langKey: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const FacebookShareButton: React.FC<FacebookShareButtonProps> = ({
  accessToken,
  symbol,
  reportContent,
  reportUrl,
  langKey,
  onSuccess,
  onError,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  // 生成分享訊息（根據語言）
  const getShareMessage = () => {
    const baseMessage = {
      'Traditional Chinese': `📊 ${symbol} 分析報告\n\n${reportContent.substring(0, 200)}...\n\n#股票分析 #AI分析`,
      'Simplified Chinese': `📊 ${symbol} 分析报告\n\n${reportContent.substring(0, 200)}...\n\n#股票分析 #AI分析`,
      English: `📊 ${symbol} Analysis Report\n\n${reportContent.substring(0, 200)}...\n\n#StockAnalysis #AIAnalysis`,
    };
    return baseMessage[langKey as keyof typeof baseMessage] || baseMessage.English;
  };

  const handleShare = async () => {
    if (!accessToken) {
      const errorMsg = langKey === 'Traditional Chinese' ? '請先登入 Facebook' :
                       langKey === 'Simplified Chinese' ? '请先登录 Facebook' :
                       'Please login to Facebook first';
      onError?.(errorMsg);
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
          reportId: `report_${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg = langKey === 'Traditional Chinese' ? '成功分享到 Facebook！' :
                          langKey === 'Simplified Chinese' ? '成功分享到 Facebook！' :
                          'Successfully shared to Facebook!';
        alert(successMsg);
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
    <button
      onClick={handleShare}
      disabled={isSharing}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#1877F2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isSharing ? 'not-allowed' : 'pointer',
        opacity: isSharing ? 0.6 : 1,
        fontSize: '14px',
        fontWeight: '500',
      }}
    >
      {isSharing ? (
        <>
          <div className="spinner" style={{
            width: '16px',
            height: '16px',
            border: '2px solid white',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>
            {langKey === 'Traditional Chinese' ? '分享中...' :
             langKey === 'Simplified Chinese' ? '分享中...' :
             'Sharing...'}
          </span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
          </svg>
          <span>
            {langKey === 'Traditional Chinese' ? '分享到 Facebook' :
             langKey === 'Simplified Chinese' ? '分享到 Facebook' :
             'Share to Facebook'}
          </span>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};