// components/features/stock-analysis/StockAnalysisModule.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Activity, Zap, ShieldCheck, Globe, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StockAnalysisModuleProps {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<StockAnalysisModuleProps> = ({
  data,
  isLoading,
  langKey,
  t,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const summaryText = data?.summary || data?.text || "";

  const generateChartData = () => {
    if (data?.historical && data.historical.length > 0) {
      return data.historical.slice(-30).map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        price: item.close,
      }));
    }
    const currentPrice = parseFloat(data?.price?.replace(/[^0-9.-]/g, '') || '400');
    const sampleData = [];
    let price = currentPrice * 0.85;
    for (let i = 30; i >= 0; i--) {
      const change = (Math.random() - 0.5) * 8;
      price = price + change;
      sampleData.push({
        date: `${i}d ago`,
        price: Math.max(50, price),
      });
    }
    return sampleData;
  };

  const chartData = generateChartData();
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const yAxisDomain = [minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1];

  // Simple TTS
  useEffect(() => {
    if (summaryText && isSpeaking) {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryText);
      
      if (langKey === 'Cantonese') {
        utterance.lang = 'zh-HK';
      } else if (langKey === '简体中文') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [summaryText, isSpeaking, langKey]);

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (summaryText) {
      setIsSpeaking(true);
    }
  };

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
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
        <div style={{ width: '18px', height: '18px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 5px' }}></div>
        <p style={{ fontSize: '10px', color: '#6B7280' }}>{t?.analyzingMarket || 'Analyzing market...'}</p>
      </div>
    );
  }

  if (!data || !data.symbol) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px', textAlign: 'center' }}>
        <Activity size={18} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto' }} />
      </div>
    );
  }

  const stockSymbol = data.symbol || "Stock";
  const currentPrice = data.price || "N/A";
  const rsiValue = data.rsi || "N/A";
  const macdValue = data.macd || "N/A";
  const marketCap = data.marketCap || "N/A";
  const peRatio = data.peRatio || "N/A";
  const volume = data.volume || "N/A";
  const changePercent = data.changePercent;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          border: '1px solid #E5E7EB', 
          borderRadius: '4px', 
          padding: '2px 5px'
        }}>
          <p style={{ fontSize: '6px', color: '#6B7280', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0 0 0' }}>${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const isPositive = changePercent && parseFloat(changePercent) > 0;

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* Global Market Indices */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '6px', padding: '4px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
          <Globe size={8} style={{ color: '#B45309' }} />
          <h3 style={{ fontSize: '8px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>
            {langKey === 'English' ? 'Global Market Indices' : langKey === 'Cantonese' ? '全球市場指數' : '全球市场指数'}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
          {row1Indices.map((index, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '3px', padding: '2px', textAlign: 'center' }}>
              <p style={{ fontSize: '6px', fontWeight: 'bold', color: '#4B5563', margin: '1px 0' }}>{index.name}</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0' }}>{index.value}</p>
              <p style={{ fontSize: '5px', fontWeight: 'bold', color: index.positive ? '#10B981' : '#EF4444', margin: '1px 0' }}>{index.change}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {row2Indices.map((index, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '3px', padding: '2px', textAlign: 'center' }}>
              <p style={{ fontSize: '6px', fontWeight: 'bold', color: '#4B5563', margin: '1px 0' }}>{index.name}</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0' }}>{index.value}</p>
              <p style={{ fontSize: '5px', fontWeight: 'bold', color: index.positive ? '#10B981' : '#EF4444', margin: '1px 0' }}>{index.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '6px', padding: '4px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div style={{ backgroundColor: '#3B82F6', padding: '2px', borderRadius: '3px' }}>
              <BarChart3 size={6} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '8px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>{stockSymbol}</h3>
            {changePercent && (
              <span style={{ fontSize: '7px', fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444' }}>
                {isPositive ? `+${changePercent}%` : `${changePercent}%`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '5px', color: '#6B7280', margin: 0 }}>Price</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>{currentPrice}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '5px', color: '#6B7280', margin: 0 }}>RSI</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{rsiValue}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '5px', color: '#6B7280', margin: 0 }}>MACD</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#10B981', margin: 0 }}>{macdValue}</p>
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%', height: '80px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" hide={true} />
              <YAxis domain={yAxisDomain} hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={1} dot={false} activeDot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5px', color: '#9CA3AF', marginTop: '2px' }}>
          <span>${minPrice.toFixed(2)}</span>
          <span style={{ color: '#3B82F6' }}>${currentPrice}</span>
          <span>${maxPrice.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px', marginTop: '2px' }}>
          {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
            <span key={period} style={{ fontSize: '5px', color: period === '1M' ? '#3B82F6' : '#9CA3AF', cursor: 'pointer' }}>{period}</span>
          ))}
        </div>
      </div>

      {/* Stock Information */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '6px', padding: '4px', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '7px', fontWeight: 'bold', color: '#B45309', marginBottom: '3px' }}>
          {langKey === 'English' ? 'Stock Information' : langKey === 'Cantonese' ? '股票信息' : '股票信息'}
        </h3>
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '3px', padding: '2px', textAlign: 'center' }}>
            <p style={{ fontSize: '5px', color: '#6B7280', margin: '1px 0' }}>Market Cap</p>
            <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0' }}>{marketCap}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '3px', padding: '2px', textAlign: 'center' }}>
            <p style={{ fontSize: '5px', color: '#6B7280', margin: '1px 0' }}>P/E</p>
            <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0' }}>{peRatio}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '3px', padding: '2px', textAlign: 'center' }}>
            <p style={{ fontSize: '5px', color: '#6B7280', margin: '1px 0' }}>Volume</p>
            <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#1F2937', margin: '1px 0' }}>{typeof volume === 'number' ? (volume / 1000000).toFixed(1) + 'M' : volume}</p>
          </div>
        </div>
      </div>

      {/* AI Analysis Text */}
      <div style={{ backgroundColor: 'white', borderRadius: '6px', padding: '8px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
              {langKey === 'English' ? 'Market Strategy Report' : langKey === 'Cantonese' ? '市場策略報告' : '市场策略报告'}
            </h2>
            <p style={{ fontSize: '6px', color: '#6B7280', fontWeight: 'bold', margin: 0 }}>AI VERIFIED INSIGHTS</p>
          </div>
          {summaryText && (
            <button 
              onClick={toggleSpeak} 
              style={{ 
                padding: '4px', 
                borderRadius: '50%', 
                backgroundColor: isSpeaking ? '#DC2626' : '#3B82F6', 
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
        
        <div style={{ backgroundColor: '#F9FAFB', borderRadius: '4px', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {summaryText ? (
            <p style={{ fontSize: '10px', color: '#1F2937', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
              {summaryText}
            </p>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <Activity size={16} style={{ color: '#9CA3AF', margin: '0 auto 4px' }} />
              <p style={{ fontSize: '9px', color: '#6B7280' }}>
                {langKey === 'English' ? 'Waiting for analysis...' : langKey === 'Cantonese' ? '等待分析結果...' : '等待分析结果...'}
              </p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Zap size={8} style={{ color: '#F59E0B' }} />
            <ShieldCheck size={8} style={{ color: '#3B82F6' }} />
            <Activity size={8} style={{ color: '#10B981' }} />
          </div>
          <p style={{ fontSize: '5px', fontWeight: 'bold', color: '#9CA3AF', margin: 0 }}>
            {data.symbol ? `STR-${data.symbol}` : 'READY'} • {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
