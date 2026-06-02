"use client";
import React from 'react';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ color: '#6B7280' }}>分析中...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF' }}>輸入股票代號開始分析</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>例如: 0700.HK, 2330.TW, TSLA</p>
      </div>
    );
  }

  // Format the analysis with proper markdown to HTML conversion
  const formattedSummary = data.summary
    .replace(/^## /gm, '<h2 style="font-size: 16px; font-weight: bold; margin: 16px 0 8px 0;">')
    .replace(/^### /gm, '<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 6px 0;">')
    .replace(/^- /gm, '<li style="margin-left: 20px;">')
    .replace(/\n/g, '<br/>');

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
      <div 
        dangerouslySetInnerHTML={{ __html: formattedSummary }}
        style={{ lineHeight: 1.6, fontSize: '13px' }}
      />
      <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
        <span>AI Analysis • {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};
