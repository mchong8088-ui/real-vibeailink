"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Activity, Zap, ShieldCheck, Globe, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { speak, stopSpeaking, onVoicesReady } from '@/app/utils/UnifiedTTS';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    
    // Wait for voices to be ready
    onVoicesReady(() => {
      setVoicesReady(true);
      console.log('[StockAnalysis] Voices ready');
    });
  }, []);

  const summaryText = data?.summary || data?.text || "";

  const chartData = (() => {
    if (data?.historical?.length > 0) {
      return data.historical.slice(-30).map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        price: item.close,
      }));
    }
    const currentPrice = parseFloat(data?.price?.replace(/[^0-9.-]/g, '') || '400');
    const sampleData = [];
    let price = currentPrice * 0.85;
    for (let i = 30; i >= 0; i--) {
      price += (Math.random() - 0.5) * 8;
      sampleData.push({ date: `${i}d ago`, price: Math.max(50, price) });
    }
    return sampleData;
  })();

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));

  const toggleSpeak = () => {
    if (!summaryText) return;
    
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      // Start speaking
      setIsSpeaking(true);
      speak(summaryText, langKey, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Stop speaking when component unmounts or text changes
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, []);

  const indices = [
    { name: "S&P 500", value: "5,234.18", change: "+0.8%", positive: true },
    { name: "NASDAQ", value: "16,428.82", change: "+1.2%", positive: true },
    { name: "DAX", value: "18,456.32", change: "-0.3%", positive: false },
    { name: "HSI", value: "19,234.56", change: "+0.5%", positive: true },
    { name: "Nikkei 225", value: "38,234.12", change: "-0.7%", positive: false },
    { name: "FTSE 100", value: "7,845.67", change: "+0.2%", positive: true },
  ];

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

  return (
    <div>
      <div style={{ background: '#FEF08A', borderRadius: 6, padding: 4, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
          {indices.slice(0,3).map((idx, i) => (
            <div key={i} style={{ flex: 1, background: 'white', borderRadius: 3, padding: 2, textAlign: 'center' }}>
              <p style={{ fontSize: 6, fontWeight: 'bold', margin: '1px 0' }}>{idx.name}</p>
              <p style={{ fontSize: 8, fontWeight: 'bold', margin: '1px 0' }}>{idx.value}</p>
              <p style={{ fontSize: 5, fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '1px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {indices.slice(3,6).map((idx, i) => (
            <div key={i} style={{ flex: 1, background: 'white', borderRadius: 3, padding: 2, textAlign: 'center' }}>
              <p style={{ fontSize: 6, fontWeight: 'bold', margin: '1px 0' }}>{idx.name}</p>
              <p style={{ fontSize: 8, fontWeight: 'bold', margin: '1px 0' }}>{idx.value}</p>
              <p style={{ fontSize: 5, fontWeight: 'bold', color: idx.positive ? '#10B981' : '#EF4444', margin: '1px 0' }}>{idx.change}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#FEF08A', borderRadius: 6, padding: 4, marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ background: '#3B82F6', padding: 2, borderRadius: 3 }}><BarChart3 size={6} color="white" /></div>
            <h3 style={{ fontSize: 8, fontWeight: 'bold', margin: 0 }}>{data.symbol}</h3>
            {data.changePercent && <span style={{ fontSize: 7, fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444' }}>{isPositive ? `+${data.changePercent}%` : `${data.changePercent}%`}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div><p style={{ fontSize: 5, margin: 0 }}>Price</p><p style={{ fontSize: 8, fontWeight: 'bold', margin: 0 }}>{data.price || 'N/A'}</p></div>
            <div><p style={{ fontSize: 5, margin: 0 }}>RSI</p><p style={{ fontSize: 8, fontWeight: 'bold', margin: 0 }}>{data.rsi || 'N/A'}</p></div>
            <div><p style={{ fontSize: 5, margin: 0 }}>MACD</p><p style={{ fontSize: 8, fontWeight: 'bold', margin: 0 }}>{data.macd || 'N/A'}</p></div>
          </div>
        </div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 4, padding: '2px 5px', fontSize: 8 }}>${payload[0].value}</div> : null} />
              <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 5, marginTop: 2 }}>
          <span>${minPrice.toFixed(2)}</span>
          <span style={{ color: '#3B82F6' }}>${data.price || 'N/A'}</span>
          <span>${maxPrice.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ background: '#FEF08A', borderRadius: 6, padding: 4, marginBottom: 4 }}>
        <h3 style={{ fontSize: 7, fontWeight: 'bold', marginBottom: 3 }}>Stock Information</h3>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ flex: 1, background: 'white', borderRadius: 3, padding: 2, textAlign: 'center' }}>
            <p style={{ fontSize: 5, margin: '1px 0' }}>Market Cap</p>
            <p style={{ fontSize: 7, fontWeight: 'bold', margin: '1px 0' }}>{data.marketCap || 'N/A'}</p>
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: 3, padding: 2, textAlign: 'center' }}>
            <p style={{ fontSize: 5, margin: '1px 0' }}>P/E</p>
            <p style={{ fontSize: 7, fontWeight: 'bold', margin: '1px 0' }}>{data.peRatio || 'N/A'}</p>
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: 3, padding: 2, textAlign: 'center' }}>
            <p style={{ fontSize: 5, margin: '1px 0' }}>Volume</p>
            <p style={{ fontSize: 7, fontWeight: 'bold', margin: '1px 0' }}>{typeof data.volume === 'number' ? (data.volume / 1000000).toFixed(1) + 'M' : data.volume || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 6, padding: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 'bold', margin: 0 }}>Market Strategy Report</h2>
            <p style={{ fontSize: 6, color: '#6B7280', margin: 0 }}>AI VERIFIED INSIGHTS</p>
          </div>
          {summaryText && voicesReady && (
            <button 
              onClick={toggleSpeak} 
              style={{ 
                padding: 4, 
                borderRadius: '50%', 
                background: isSpeaking ? '#DC2626' : '#3B82F6', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSpeaking ? <VolumeX size={12} color="white" /> : <Volume2 size={12} color="white" />}
            </button>
          )}
        </div>
        <div style={{ background: '#F9FAFB', borderRadius: 4, padding: 8, maxHeight: 200, overflowY: 'auto' }}>
          {summaryText ? (
            <p style={{ fontSize: 10, color: '#1F2937', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{summaryText}</p>
          ) : (
            <div style={{ textAlign: 'center', padding: 12 }}>
              <Activity size={16} style={{ color: '#9CA3AF', margin: '0 auto 4px' }} />
              <p style={{ fontSize: 9, color: '#6B7280' }}>Waiting for analysis...</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 4, borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 6 }}><Zap size={8} /><ShieldCheck size={8} /><Activity size={8} /></div>
          <p style={{ fontSize: 5, margin: 0 }}>{data.symbol ? `STR-${data.symbol}` : 'READY'} • {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
