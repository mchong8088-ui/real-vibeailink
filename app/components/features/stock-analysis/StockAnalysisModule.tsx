"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Globe, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [period, setPeriod] = useState<'1M' | '3M' | '1Y'>('1M');
  
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

  // Generate mock chart data
  const generateChartData = () => {
    const currentPrice = data?.price || 100;
    const dataPoints = [];
    let price = currentPrice * 0.85;
    for (let i = 30; i >= 0; i--) {
      const change = (Math.random() - 0.5) * 8;
      price = price + change;
      const date = new Date();
      date.setDate(date.getDate() - i);
      dataPoints.push({
        date: date.toLocaleDateString(),
        price: Math.max(50, price),
      });
    }
    return dataPoints;
  };

  const chartData = generateChartData();
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));

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
      {/* Global Market Indices */}
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

      {/* Stock Info Bar */}
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

      {/* Price Chart */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>Price Trend</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['1M', '3M', '1Y'].map((p) => (
              <button key={p} onClick={() => setPeriod(p as any)} style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '4px', border: period === p ? '1px solid #3B82F6' : '1px solid #E5E7EB', backgroundColor: period === p ? '#EFF6FF' : 'white', color: period === p ? '#3B82F6' : '#6B7280', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} fontSize={10} width={35} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', marginTop: '8px' }}>
          <span>${minPrice.toFixed(2)}</span>
          <span style={{ color: '#3B82F6' }}>${data.price?.toFixed(2) || 'N/A'}</span>
          <span>${maxPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Analysis Report */}
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
