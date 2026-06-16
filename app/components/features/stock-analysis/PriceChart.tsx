"use client";
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

// Filter data by date range - improved with fallbacks
const filterDataByRange = (data: any[], range: string) => {
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  let startDate = new Date();
  let filteredData = [];
  
  switch (range) {
    case '1D':
      startDate.setDate(now.getDate() - 1);
      filteredData = data.filter(item => new Date(item.date) >= startDate);
      if (filteredData.length < 2) {
        filteredData = data.slice(-5);
      }
      break;
    case '1W':
      startDate.setDate(now.getDate() - 7);
      filteredData = data.filter(item => new Date(item.date) >= startDate);
      if (filteredData.length < 3) {
        filteredData = data.slice(-10);
      }
      break;
    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      filteredData = data.filter(item => new Date(item.date) >= startDate);
      if (filteredData.length < 3) {
        filteredData = data.slice(-20);
      }
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      filteredData = data.filter(item => new Date(item.date) >= startDate);
      if (filteredData.length < 3) {
        filteredData = data.slice(-30);
      }
      break;
    default:
      startDate.setMonth(now.getMonth() - 3);
      filteredData = data.filter(item => new Date(item.date) >= startDate);
  }
  
  return filteredData;
};

// Get appropriate time label
const getTimeLabel = (range: string) => {
  switch (range) {
    case '1D': return '1天';
    case '1W': return '1週';
    case '3M': return '3個月';
    case '6M': return '6個月';
    default: return '3個月';
  }
};

// Format date based on range
const formatDate = (value: string, range: string) => {
  const date = new Date(value);
  if (range === '1D') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '1W') {
    return `${date.getMonth()+1}/${date.getDate()}`;
  }
  return `${date.getMonth()+1}/${date.getDate()}`;
};

export const PriceChart = ({ data, langKey }: { data: any[]; langKey?: string }) => {
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

  // Check if we have Bollinger Bands data
  const hasBollingerBands = filteredData.some(d => d.upper && d.middle && d.lower);
  const hasVWAP = filteredData.some(d => d.vwap);
  const hasEnoughData = filteredData.length >= 2;

  return (
    <div style={{ width: '100%', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
      {/* Header with title and price info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e293b' }}>
            📈 價格走勢圖（{getTimeLabel(selectedRange)}）
            {!hasEnoughData && (
              <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: '8px' }}>
                ⚠️ 數據不足
              </span>
            )}
          </h4>
          {latestPrice && hasEnoughData && (
            <div style={{ marginTop: '5px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                ${latestPrice.toFixed(2)}
              </span>
              <span style={{ marginLeft: '10px', color: priceChange >= 0 ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
              </span>
            </div>
          )}
        </div>
        
        {/* Time range buttons - ENHANCED VISIBILITY */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          background: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          {timeRanges.map((range) => {
            const rangeData = filterDataByRange(data, range.value);
            const hasData = rangeData.length >= 2;
            const isActive = selectedRange === range.value;
            
            return (
              <button
                key={range.value}
                onClick={() => {
                  if (hasData || isActive) {
                    setSelectedRange(range.value);
                  }
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : (hasData ? '#475569' : '#94a3b8'),
                  cursor: (hasData || isActive) ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && hasData) {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={!hasData && !isActive ? `Not enough data for ${range.label} view` : `View ${range.label}`}
              >
                {range.label}
                {!hasData && !isActive && ' ⚠️'}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chart - only show if we have data */}
      {hasEnoughData ? (
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
              tickFormatter={(value) => formatDate(value, selectedRange)}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              fontSize={12} 
              tick={{ fill: '#64748b' }}
              tickFormatter={(value) => `$${value}`}
              width={60}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => {
                if (value === undefined || value === null) return ['N/A', name];
                if (name === 'price' || name === 'close') return [`$${value.toFixed(2)}`, '股價'];
                if (name === 'upper') return [`$${value.toFixed(2)}`, '上軌 (Bollinger Upper)'];
                if (name === 'middle') return [`$${value.toFixed(2)}`, '中軌 (SMA 20)'];
                if (name === 'lower') return [`$${value.toFixed(2)}`, '下軌 (Bollinger Lower)'];
                if (name === 'vwap') return [`$${value.toFixed(2)}`, 'VWAP'];
                return [`$${value.toFixed(2)}`, name];
              }}
              labelFormatter={(label) => {
                const date = new Date(label);
                if (selectedRange === '1D') {
                  return date.toLocaleString();
                }
                return date.toLocaleDateString();
              }}
            />
            
            {/* Bollinger Bands - Upper and Lower as Area */}
            {hasBollingerBands && (
              <>
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
                <Line 
                  type="monotone" 
                  dataKey="middle" 
                  stroke="#94a3b8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}
            
            {/* Price Line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={3} 
              dot={false} 
            />
            
            {/* VWAP (if exists) */}
            {hasVWAP && (
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
      ) : (
        <div style={{ 
          height: '320px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '14px',
          flexDirection: 'column',
          gap: '8px',
          background: '#fafafa',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '32px' }}>📊</span>
          <span>Not enough data for this time range</span>
          <span style={{ fontSize: '12px' }}>Try selecting a different time period</span>
        </div>
      )}
      
      {/* Legend */}
      {hasEnoughData && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '20px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>股價</span>
          </div>
          {hasBollingerBands && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '3px', background: '#94a3b8', borderRadius: '2px', borderStyle: 'dashed' }}></div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>SMA 20 (中軌)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '12px', background: '#e2e8f0', borderRadius: '2px', opacity: 0.5 }}></div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>布林通道 (上/下軌)</span>
              </div>
            </>
          )}
          {hasVWAP && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '3px', background: '#f59e0b', borderRadius: '2px', borderStyle: 'dashed' }}></div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>VWAP</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};