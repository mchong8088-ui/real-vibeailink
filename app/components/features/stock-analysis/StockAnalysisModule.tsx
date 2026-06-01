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
        <p style={{ color: '#6B7280' }}>Analyzing...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF' }}>Enter a stock symbol to begin analysis</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{data.symbol || 'Stock'}</h2>
        {data.price && data.price !== 'N/A' && (
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0' }}>${data.price}</p>
        )}
      </div>
      
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)}
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '12px', color: '#9CA3AF' }}>
        <span>{data.symbol || 'Stock'} • {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
