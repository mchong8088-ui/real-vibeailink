"use client";
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

// Filter data by date range
const filterDataByRange = (data: any[], range: string) => {
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  let startDate = new Date();
  
  switch (range) {
    case '1D':
      startDate.setDate(now.getDate() - 1);
      break;
    case '1W':
      startDate.setDate(now.getDate() - 7);
      break;
    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      break;
    default:
      startDate.setMonth(now.getMonth() - 3);
  }
  
  return data.filter(item => new Date(item.date) >= startDate);
};

export const PriceChart = ({ data }: { data: any[] }) => {
  const [selectedRange, setSelectedRange] = useState('3M');
  
  // Filter data based on selected range
  const filteredData = useMemo(() => filterDataByRange(data, selectedRange), [data, selectedRange]);
  
  const timeRanges = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
  ];
  
  // Get latest price for display
  const latestPrice = filteredData.length > 0 ? filteredData[filteredData.length - 1]?.price || filteredData[filteredData.length - 1]?.close : null;
  const previousPrice = filteredData.length > 1 ? filteredData[filteredData.length - 2]?.price || filteredData[filteredData.length - 2]?.close : null;
  const priceChange = latestPrice && previousPrice ? latestPrice - previousPrice : 0;
  const priceChangePercent = previousPrice && latestPrice ? ((priceChange / previousPrice) * 100).toFixed(2) : '0';

  return (
    <div style={{ width: '100%', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
      {/* Header with title and price info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e293b' }}>價格走勢圖（最近{selectedRange === '1D' ? '1天' : selectedRange === '1W' ? '1週' : selectedRange === '3M' ? '3個月' : '6個月'}）</h4>
          {latestPrice && (
            <div style={{ marginTop: '5px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>${latestPrice.toFixed(2)}</span>
              <span style={{ marginLeft: '10px', color: priceChange >= 0 ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
              </span>
            </div>
          )}
        </div>
        
        {/* Time range buttons */}
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: selectedRange === range.value ? '#2563eb' : 'transparent',
                color: selectedRange === range.value ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: selectedRange === range.value ? '600' : '500',
                transition: 'all 0.2s',
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={filteredData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (selectedRange === '1D') {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return `${date.getMonth()+1}/${date.getDate()}`;
            }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            fontSize={12} 
            tick={{ fill: '#64748b' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number, name: string) => {
              if (name === 'price' || name === 'close') return [`$${value.toFixed(2)}`, '股價'];
              if (name === 'upper') return [`$${value.toFixed(2)}`, '上軌 (Bollinger Upper)'];
              if (name === 'middle') return [`$${value.toFixed(2)}`, '中軌 (SMA 20)'];
              if (name === 'lower') return [`$${value.toFixed(2)}`, '下軌 (Bollinger Lower)'];
              return [`$${value.toFixed(2)}`, name];
            }}
          />
          
          {/* Bollinger Bands - Upper and Lower as Area */}
          <Area 
            type="monotone" 
            dataKey="upper" 
            stroke="#94a3b8" 
            strokeWidth={1}
            fill="#e2e8f0" 
            fillOpacity={0.2} 
            dot={false}
          />
          <Area 
            type="monotone" 
            dataKey="lower" 
            stroke="#94a3b8" 
            strokeWidth={1}
            fill="#ffffff" 
            dot={false}
          />
          
          {/* Middle Band (SMA 20) */}
          <Line 
            type="monotone" 
            dataKey="middle" 
            stroke="#94a3b8" 
            strokeWidth={1.5} 
            strokeDasharray="4 4"
            dot={false}
          />
          
          {/* 股價主線 */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={false} 
          />
          
          {/* VWAP (if exists) */}
          {filteredData.some(d => d.vwap) && (
            <Line 
              type="monotone" 
              dataKey="vwap" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>股價</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '3px', background: '#94a3b8', borderRadius: '2px', borderStyle: 'dashed' }}></div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>SMA 20 (中軌)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '12px', background: '#e2e8f0', borderRadius: '2px', opacity: 0.5 }}></div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>布林通道 (上/下軌)</span>
        </div>
        {filteredData.some(d => d.vwap) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '20px', height: '3px', background: '#f59e0b', borderRadius: '2px', borderStyle: 'dashed' }}></div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>VWAP</span>
          </div>
        )}
      </div>
    </div>
  );
};