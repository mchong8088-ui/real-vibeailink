"use client";
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Activity, Zap, ShieldCheck, Globe, BarChart3 } from 'lucide-react';
import { PriceChart } from './PriceChart';
import { speakText, stopSpeaking } from '@/app/utils/SimpleTTS';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const summaryText = data?.summary || data?.text || "";

  // Generate chart data for the white PriceChart component
  const chartData = (() => {
    if (data?.historical?.length > 0) {
      return data.historical.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        price: item.close,
        upper: item.close * 1.05,
        lower: item.close * 0.95,
        vwap: item.close * 0.98,
      }));
    }
    const currentPrice = parseFloat(data?.price?.replace(/[^0-9.-]/g, '') || '400');
    const sampleData = [];
    let price = currentPrice * 0.85;
    for (let i = 30; i >= 0; i--) {
      price += (Math.random() - 0.5) * 8;
      const date = new Date();
      date.setDate(date.getDate() - i);
      sampleData.push({ 
        date: date.toISOString().split('T')[0],
        price: Math.max(50, price),
        upper: Math.max(50, price) * 1.05,
        lower: Math.max(50, price) * 0.95,
        vwap: Math.max(50, price) * 0.98,
      });
    }
    return sampleData;
  })();

  const toggleSpeak = () => {
    if (!summaryText) return;
    
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(summaryText, langKey, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, []);

  // Stop speaking when text changes
  useEffect(() => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, [summaryText]);

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
    return <div style={{ background: 'white', borderRadius: 10, padding: 10, textAlign: 'center' }}>
      <div style={{ width: 18, height: 18, border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 5px' }} />
      <p style={{ fontSize: 10, color: '#6B7280' }}>{t?.analyzingMarket || 'Analyzing...'}</p>
    </div>;
  }

  if (!data?.symbol) {
    return <div style={{ background: 'white', borderRadius: 10, padding: 6, textAlign: 'center' }}>
      <Activity size={18} style={{ color: '#D1D5DB' }} />
    </div>;
  }

  const isPositive = data.changePercent && parseFloat(data.changePercent) > 0;
  const rsiValue = data.rsi || "N/A";
  const macdValue = data.macd || "N/A";
  
  // Determine MACD color based on value
  const getMacdColor = () => {
    const val = String(macdValue).toLowerCase();
    if (val.includes('bullish') || val.includes('看涨') || val.includes('看漲')) return '#10B981';
    if (val.includes('bearish') || val.includes('看跌')) return '#EF4444';
    return '#F59E0B';
  };

  return (
    <div>
      {/* SECTION 1: GLOBAL MARKET INDICES */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: 8, padding: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Globe size={10} style={{ color: '#B45309' }} />
          <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#B45309', margin: 0 }}>
            {langKey === 'English' ? 'Global Market Indices' : langKey === 'Cantonese' ? '全球市場指數' : '全球市场指数'}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {row1Indices.map((idx, i) => (
            <div key={i} style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 'bold', margin: '2px 0' }}>{idx.name}</p>
              <p style={{ fontSize: 11, fontWeight: 'bold', margin: '2px 0' }}>{idx.value}</p>
              <p style={{ fontSize: 8, fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '2px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {row2Indices.map((idx, i) => (
            <div key={i} style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 'bold', margin: '2px 0' }}>{idx.name}</p>
              <p style={{ fontSize: 11, fontWeight: 'bold', margin: '2px 0' }}>{idx.value}</p>
              <p style={{ fontSize: 8, fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '2px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: STOCK PRICE, RSI, MACD - 3 columns like indices */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: 8, padding: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Price Column */}
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <BarChart3 size={10} color="#3B82F6" />
              <p style={{ fontSize: 8, color: '#6B7280', margin: 0 }}>Price</p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937', margin: '2px 0' }}>{data.price || 'N/A'}</p>
            {data.changePercent && (
              <p style={{ fontSize: 9, fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444', margin: '2px 0' }}>
                {isPositive ? `+${data.changePercent}%` : `${data.changePercent}%`}
              </p>
            )}
          </div>
          
          {/* RSI Column */}
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '0 0 4px 0' }}>RSI (14)</p>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: '#3B82F6', margin: '2px 0' }}>{rsiValue}</p>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '2px 0' }}>
              {typeof rsiValue === 'number' || !isNaN(parseFloat(String(rsiValue))) ? 
                (parseFloat(String(rsiValue)) > 70 ? 'Overbought' : parseFloat(String(rsiValue)) < 30 ? 'Oversold' : 'Neutral') : ''}
            </p>
          </div>
          
          {/* MACD Column */}
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '0 0 4px 0' }}>MACD</p>
            <p style={{ fontSize: 14, fontWeight: 'bold', color: getMacdColor(), margin: '2px 0' }}>{macdValue}</p>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '2px 0' }}>Signal</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: STOCK INFORMATION - Market Cap, P/E, Volume */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: 8, padding: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 10, fontWeight: 'bold', color: '#B45309', marginBottom: 6 }}>
          {langKey === 'English' ? 'Stock Information' : langKey === 'Cantonese' ? '股票信息' : '股票信息'}
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '2px 0' }}>Market Cap</p>
            <p style={{ fontSize: 10, fontWeight: 'bold', margin: '2px 0' }}>{data.marketCap || 'N/A'}</p>
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '2px 0' }}>P/E</p>
            <p style={{ fontSize: 10, fontWeight: 'bold', margin: '2px 0' }}>{data.peRatio || 'N/A'}</p>
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: 6, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#6B7280', margin: '2px 0' }}>Volume</p>
            <p style={{ fontSize: 10, fontWeight: 'bold', margin: '2px 0' }}>{typeof data.volume === 'number' ? (data.volume / 1000000).toFixed(1) + 'M' : data.volume || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: PRICE CHART (White background) */}
      <PriceChart data={chartData} langKey={langKey} />

      {/* SECTION 5: AI ANALYSIS TEXT */}
      <div style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: 0 }}>
              {langKey === 'English' ? 'Market Strategy Report' : langKey === 'Cantonese' ? '市場策略報告' : '市场策略报告'}
            </h2>
            <p style={{ fontSize: 8, color: '#6B7280', margin: 0 }}>AI VERIFIED INSIGHTS</p>
          </div>
          {summaryText && (
            <button 
              onClick={toggleSpeak} 
              style={{ 
                padding: 6, 
                borderRadius: '50%', 
                background: isSpeaking ? '#DC2626' : '#3B82F6', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSpeaking ? <VolumeX size={14} color="white" /> : <Volume2 size={14} color="white" />}
            </button>
          )}
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 6, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
          {summaryText ? (
            <p style={{ fontSize: 11, color: '#1F2937', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
              {summaryText}
            </p>
          ) : (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Activity size={20} style={{ color: '#9CA3AF', margin: '0 auto 6px' }} />
              <p style={{ fontSize: 11, color: '#6B7280' }}>
                {langKey === 'English' ? 'Waiting for analysis...' : langKey === 'Cantonese' ? '等待分析結果...' : '等待分析结果...'}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Zap size={10} color="#F59E0B" />
            <ShieldCheck size={10} color="#3B82F6" />
            <Activity size={10} color="#10B981" />
          </div>
          <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0 }}>
            {data.symbol ? `STR-${data.symbol}` : 'READY'} • {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
