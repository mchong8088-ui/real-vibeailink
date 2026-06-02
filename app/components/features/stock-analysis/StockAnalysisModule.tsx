"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area } from 'recharts';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  const [period, setPeriod] = useState<'1M' | '3M' | '1Y'>('1M');
  const [chartData, setChartData] = useState<any[]>([]);
  
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

  // 計算保力加通道
  const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
    if (prices.length < period) return { upper: [], middle: [], lower: [] };
    const middle = [];
    const upper = [];
    const lower = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      middle.push(sma);
      upper.push(sma + stdDev * multiplier);
      lower.push(sma - stdDev * multiplier);
    }
    return { upper, middle, lower };
  };

  // 當 data 或 period 改變時，重新計算圖表數據
  useEffect(() => {
    if (!data?.historical || data.historical.length === 0) {
      // 如果沒有歷史數據，生成模擬數據
      const currentPrice = data?.price || 100;
      const mockData = [];
      let price = currentPrice * 0.85;
      for (let i = 30; i >= 0; i--) {
        const change = (Math.random() - 0.5) * 8;
        price = price + change;
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          close: Math.max(50, price),
        });
      }
      data.historical = mockData;
    }
    
    if (data?.historical && data.historical.length > 0) {
      let historical = [...data.historical];
      const now = new Date();
      let daysToShow = 30;
      if (period === '3M') daysToShow = 90;
      if (period === '1Y') daysToShow = 365;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - daysToShow);
      historical = historical.filter((h: any) => new Date(h.date) >= cutoffDate);
      
      if (historical.length === 0) {
        setChartData([]);
        return;
      }
      
      const prices = historical.map((h: any) => h.close);
      const bands = calculateBollingerBands(prices, 20, 2);
      
      const formattedData = [];
      for (let i = 0; i < historical.length; i++) {
        const date = new Date(historical[i].date);
        let dateStr = '';
        if (period === '1Y') {
          dateStr = date.toLocaleDateString(undefined, { month: 'short' });
        } else {
          dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        formattedData.push({
          date: dateStr,
          fullDate: historical[i].date,
          price: historical[i].close,
          upper: i >= 19 ? bands.upper[i - 19] : null,
          middle: i >= 19 ? bands.middle[i - 19] : null,
          lower: i >= 19 ? bands.lower[i - 19] : null,
        });
      }
      
      setChartData(formattedData);
    }
  }, [data, period]);

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
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>例如: 2330.TW, 0700.HK, TSLA</p>
      </div>
    );
  }

  const isPositive = data.changePercent > 0;
  const priceDisplay = data.price ? `${data.price.toFixed(2)}` : 'N/A';
  const changeDisplay = data.changePercent ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : 'N/A';
  const rsiDisplay = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  const trendDisplay = data.trend || 'Sideways';

  const getCurrencySymbol = () => {
    if (data.symbol?.endsWith('.TW')) return 'NT$';
    if (data.symbol?.endsWith('.HK')) return 'HK$';
    return '$';
  };
  const currencySymbol = getCurrencySymbol();

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : 0;

  const labelInterval = Math.max(1, Math.floor(chartData.length / 6));

  const formatXTick = (value: string, index: number) => {
    if (index % labelInterval === 0) return value;
    return '';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#6B7280' }}>{label}</p>
          <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#2563EB' }}>{currencySymbol}{payload[0]?.value?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* 全球市場指數 */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px' }}>🌍</span>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>全球市場指數</h3>
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

      {/* 股票資訊欄 */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Price</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{currencySymbol}{priceDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>RSI(14)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{rsiDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Trend</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{trendDisplay === 'Uptrend' ? '📈' : trendDisplay === 'Downtrend' ? '📉' : '➡️'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 價格走勢圖 */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>價格走勢圖 (保力加通道)</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['1M', '3M', '1Y'].map((p) => (
              <button key={p} onClick={() => setPeriod(p as any)} style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '6px', border: period === p ? '1px solid #3B82F6' : '1px solid #E5E7EB', backgroundColor: period === p ? '#EFF6FF' : 'white', color: period === p ? '#3B82F6' : '#6B7280', cursor: 'pointer', fontWeight: period === p ? '600' : '400' }}>{p}</button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickFormatter={formatXTick} fontSize={10} interval={0} tick={{ fill: '#6B7280' }} />
                  <YAxis domain={[minPrice * 0.95, maxPrice * 1.05]} fontSize={10} width={45} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="upper" stroke="#E5E7EB" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="lower" stroke="#E5E7EB" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="middle" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
                  <Line type="monotone" dataKey="price" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#2563EB' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#9CA3AF', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '2px', backgroundColor: '#2563EB' }} /><span>收盤價</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '2px', backgroundColor: '#F59E0B', borderStyle: 'dashed' }} /><span>中軌線(SMA20)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '1px', backgroundColor: '#E5E7EB' }} /><span>保力加通道</span></div>
              </div>
              <div><span>區間: {currencySymbol}{minPrice.toFixed(2)} - {currencySymbol}{maxPrice.toFixed(2)}</span></div>
            </div>
          </>
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#9CA3AF' }}>圖表數據載入中...</p>
          </div>
        )}
      </div>

      {/* 分析報告 */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>{data.summary}</div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>AI Analysis • {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
