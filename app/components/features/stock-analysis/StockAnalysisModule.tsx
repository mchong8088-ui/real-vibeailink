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
    const currentPrice = parseFloat(data?.price?.replace(/[^0-9.-]/g, '') || 400);
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

  useEffect(() => {
    if (summaryText && isSpeaking) {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryText);
      if (langKey === 'Cantonese') utterance.lang = 'zh-HK';
      else if (langKey === '简体中文') utterance.lang = 'zh-CN';
      else utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    return () => { if (utteranceRef.current) window.speechSynthesis.cancel(); };
  }, [summaryText, isSpeaking, langKey]);

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (summaryText) {
      setIsSpeaking(true);
    }
  };

  // Global Market Indices - 2 rows of 3 columns (3 items per row)
  const globalIndices = [
    { name: "S&P 500", value: "5,234.18", change: "+0.8%", positive: true },
    { name: "NASDAQ", value: "16,428.82", change: "+1.2%", positive: true },
    { name: "DAX", value: "18,456.32", change: "-0.3%", positive: false },
    { name: "HSI", value: "19,234.56", change: "+0.5%", positive: true },
    { name: "Nikkei 225", value: "38,234.12", change: "-0.7%", positive: false },
    { name: "FTSE 100", value: "7,845.67", change: "+0.2%", positive: true },
  ];

  // Split into 2 rows of 3 columns each
  const row1Indices = globalIndices.slice(0, 3);
  const row2Indices = globalIndices.slice(3, 6);

  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
        <p style={{ fontSize: '13px', color: '#6B7280' }}>{t?.analyzingMarket || 'Analyzing market...'}</p>
      </div>
    );
  }

  if (!data || !data.symbol) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
        <Activity size={40} strokeWidth={1} style={{ color: '#D1D5DB', margin: '0 auto 12px' }} />
        <p style={{ color: '#9CA3AF', fontSize: '14px' }}>{langKey === 'English' ? 'Please input stock symbol below' : langKey === 'Cantonese' ? '請輸入股票代號' : '请输入股票代码'}</p>
        <p style={{ color: '#D1D5DB', fontSize: '12px', marginTop: '8px' }}>e.g.: 0700.hk, TSLA, 2330.TW</p>
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
        borderRadius: '8px', 
        padding: '6px 10px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(4px)'
      }}>
        <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1F2937', margin: '4px 0 0 0' }}>${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

  const isPositive = changePercent && parseFloat(changePercent) > 0;

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* SECTION 1: GLOBAL MARKET INDICES - Yellow background, 2 rows of 3 columns */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '10px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Globe size={14} style={{ color: '#B45309' }} />
          <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>
            {langKey === 'English' ? 'Global Market Indices' : langKey === 'Cantonese' ? '全球市場指數' : '全球市场指数'}
          </h3>
        </div>
        {/* Row 1 - 3 columns */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {row1Indices.map((index, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#4B5563' }}>{index.name}</p>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1F2937' }}>{index.value}</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: index.positive ? '#10B981' : '#EF4444' }}>{index.change}</p>
            </div>
          ))}
        </div>
        {/* Row 2 - 3 columns */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {row2Indices.map((index, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#4B5563' }}>{index.name}</p>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1F2937' }}>{index.value}</p>
              <p style={{ fontSize: '8px', fontWeight: 'bold', color: index.positive ? '#10B981' : '#EF4444' }}>{index.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CHART + LOCAL STOCK INFO - Yellow background */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '10px', marginBottom: '12px' }}>
        
        {/* Local Stock Info - 1 row of 3 columns (Price, RSI, MACD) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ backgroundColor: '#3B82F6', padding: '4px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={12} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>{stockSymbol}</h3>
            {changePercent && (
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: isPositive ? '#10B981' : '#EF4444' }}>
                {isPositive ? `+${changePercent}%` : `${changePercent}%`}
              </span>
            )}
          </div>
          {/* 3 values in 1 row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: '#6B7280' }}>Price</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1F2937' }}>{currentPrice}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: '#6B7280' }}>RSI</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#3B82F6' }}>{rsiValue}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '8px', color: '#6B7280' }}>MACD</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#10B981' }}>{macdValue}</p>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div style={{ width: '100%', height: isMobile ? '140px' : '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" hide={true} />
              <YAxis domain={yAxisDomain} hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#3B82F6' }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Price range labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#9CA3AF', marginTop: '4px' }}>
          <span>${minPrice.toFixed(2)}</span>
          <span style={{ color: '#3B82F6' }}>${currentPrice}</span>
          <span>${maxPrice.toFixed(2)}</span>
        </div>
        
        {/* Time range selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
            <span key={period} style={{ fontSize: '8px', color: period === '1M' ? '#3B82F6' : '#9CA3AF', cursor: 'pointer' }}>{period}</span>
          ))}
        </div>
      </div>

      {/* SECTION 3: STOCK INFORMATION - 1 row of 3 columns */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '10px', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', color: '#B45309', marginBottom: '8px' }}>
          {langKey === 'English' ? 'Stock Information' : langKey === 'Cantonese' ? '股票信息' : '股票信息'}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
            <p style={{ fontSize: '7px', color: '#6B7280' }}>{langKey === 'English' ? 'Market Cap' : '市值'}</p>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#1F2937' }}>{marketCap}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
            <p style={{ fontSize: '7px', color: '#6B7280' }}>{langKey === 'English' ? 'P/E Ratio' : '市盈率'}</p>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#1F2937' }}>{peRatio}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
            <p style={{ fontSize: '7px', color: '#6B7280' }}>{langKey === 'English' ? 'Volume' : '成交量'}</p>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#1F2937' }}>{typeof volume === 'number' ? volume.toLocaleString() : volume}</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: AI ANALYSIS TEXT */}
      <div style={{ backgroundColor: '#1F2937', borderRadius: '12px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '-8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#3B82F6' }}>M</div>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#374151', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: 'white' }}>T</div>
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', margin: 0 }}>{langKey === 'English' ? 'Market Strategy Report' : langKey === 'Cantonese' ? '市場策略報告' : '市场策略报告'}</h2>
              <p style={{ fontSize: '8px', color: '#60A5FA', fontWeight: 'bold', margin: 0 }}>AI VERIFIED INSIGHTS</p>
            </div>
          </div>
          {summaryText && (
            <button onClick={toggleSpeak} style={{ padding: '6px', borderRadius: '50%', backgroundColor: isSpeaking ? '#DC2626' : '#4B5563', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSpeaking ? <VolumeX size={14} color="white" /> : <Volume2 size={14} color="white" />}
            </button>
          )}
        </div>
        
        {/* Scrollable Text Area */}
        <div style={{ backgroundColor: '#374151', borderRadius: '10px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
          {summaryText ? (
            <p style={{ fontSize: '11px', color: '#E5E7EB', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>{summaryText}</p>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Activity size={24} style={{ color: '#6B7280', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{langKey === 'English' ? 'Waiting for analysis...' : langKey === 'Cantonese' ? '等待分析結果...' : '等待分析结果...'}</p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #4B5563' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Zap size={12} style={{ color: '#FBBF24' }} />
            <ShieldCheck size={12} style={{ color: '#60A5FA' }} />
            <Activity size={12} style={{ color: '#34D399' }} />
          </div>
          <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#6B7280', margin: 0 }}>
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