"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Globe, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

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

  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ color: '#6B7280' }}>{t?.analyzingMarket || 'Analyzing market...'}</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || !data.summary) {
    return null;
  }

  const companyName = data.companyName || data.symbol;
  const isPositive = data.changePercent > 0;

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Globe size={14} style={{ color: '#B45309' }} />
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>
            {langKey === 'English' ? 'Global Market Indices' : langKey === 'Cantonese' ? '全球市場指數' : '全球市场指数'}
          </h3>
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

      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#3B82F6', padding: '6px', borderRadius: '8px' }}>
              <BarChart3 size={14} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{companyName}</h3>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{data.symbol}</p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444' }}>
              {isPositive ? `+${data.changePercent?.toFixed(2)}%` : `${data.changePercent?.toFixed(2)}%`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Price</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>${data.price?.toFixed(2) || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>RSI(14)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{data.rsi?.toFixed(1) || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Trend</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {data.trend === 'Bullish 📈' ? <TrendingUp size={16} color="#10B981" /> : 
                 data.trend === 'Bearish 📉' ? <TrendingDown size={16} color="#EF4444" /> : '➡️'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>
          {typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)}
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>AI Analysis • {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
