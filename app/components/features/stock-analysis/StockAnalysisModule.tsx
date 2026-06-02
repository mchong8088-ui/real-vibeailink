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

  // Display real price if available
  const priceDisplay = data.price ? `${data.price.toFixed(2)}` : 'N/A';
  const changeDisplay = data.changePercent ? `${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%` : 'N/A';
  const rsiDisplay = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  const macdDisplay = data.macd || 'N/A';
  const trendDisplay = data.trend || 'N/A';

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Price Info Bar */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{data.symbol}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0' }}>${priceDisplay}</p>
            <p style={{ fontSize: '14px', color: data.changePercent >= 0 ? '#10B981' : '#EF4444', margin: 0 }}>
              {changeDisplay}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>RSI(14)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{rsiDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>MACD</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{macdDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Trend</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{trendDisplay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Report */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>
          {data.summary}
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>AI Analysis • {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
