"use client";
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

// Filter data by date range
const filterDataByRange = (data: any[], range: string) => {
  if (!data || data.length === 0) return [];
  
  const now = new Date();
  let startDate = new Date();
  let filteredData = [];
  
  const cleanData = data.map(item => ({
    ...item,
    dateObj: new Date(item.date),
    price: item.price || item.close || 0,
    close: item.close || item.price || 0,
    upper: item.upper || null,
    middle: item.middle || null,
    lower: item.lower || null,
  }));
  
  switch (range) {
    case '1W':
      startDate.setDate(now.getDate() - 7);
      filteredData = cleanData.filter(item => item.dateObj >= startDate);
      if (filteredData.length < 3) {
        filteredData = cleanData.slice(-10);
      }
      break;
	case '1M':
      startDate.setMonth(now.getMonth() - 1);
      filteredData = cleanData.filter(item => item.dateObj >= startDate);
      if (filteredData.length < 3) {
        filteredData = cleanData.slice(-20);
      }
      break;

    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      filteredData = cleanData.filter(item => item.dateObj >= startDate);
      if (filteredData.length < 3) {
        filteredData = cleanData.slice(-20);
      }
      break;
    default:
      startDate.setMonth(now.getMonth() - 3);
      filteredData = cleanData.filter(item => item.dateObj >= startDate);
  }
  
  return filteredData;
};

// Get appropriate time label
const getTimeLabel = (range: string) => {
  switch (range) {
    case '1W': return '1週';
    case '1M': return '1個月';
    case '3M': return '3個月';
    default: return '3個月';
  }
};

// Format date properly for X-axis
const formatDate = (value: string, range: string) => {
  try {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    
    // For 1W and 3M, show month/day
    return `${date.getMonth()+1}/${date.getDate()}`;
  } catch (e) {
    return '';
  }
};

export const PriceChart = ({ data, langKey }: { data: any[]; langKey?: string }) => {
  const [selectedRange, setSelectedRange] = useState('3M');
  
  // Filter data based on selected range
  const filteredData = useMemo(() => filterDataByRange(data, selectedRange), [data, selectedRange]);
  
  const timeRanges = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' }
  { label: '3M', value: '3M' },
];
  
  // Get latest price for display
  const latestItem = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const latestPrice = latestItem?.price || latestItem?.close || null;
  const previousItem = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;
  const previousPrice = previousItem?.price || previousItem?.close || null;
  
  const priceChange = latestPrice && previousPrice ? latestPrice - previousPrice : 0;
  const priceChangePercent = previousPrice && latestPrice && previousPrice !== 0 
    ? ((priceChange / previousPrice) * 100).toFixed(2) 
    : '0';

  // Check if we have Bollinger Bands data - check if any item has all three bands
  const hasBollingerBands = filteredData.some(d => 
  d.upper !== null && d.upper !== undefined && d.upper > 0
);
  
  const hasVWAP = filteredData.some(d => d.vwap !== undefined && d.vwap !== null && d.vwap > 0);
  const hasEnoughData = filteredData.length >= 2;

  // Debug logging
  console.log(`📊 PriceChart - Range: ${selectedRange}, Data points: ${filteredData.length}, Has Bollinger: ${hasBollingerBands}`);
  if (filteredData.length > 0) {
    console.log('📊 Sample data point:', filteredData[0]);
  }

  return (
    <div style={{ width: '100%', background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
      {/* Header with title and price info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>
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
        
        {/* Time range buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          background: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
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
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : (hasData ? '#475569' : '#94a3b8'),
                  cursor: (hasData || isActive) ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s ease',
                }}
                title={!hasData && !isActive ? `Not enough data for ${range.label} view` : `View ${range.label}`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chart */}
      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={filteredData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBollinger" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(value) => formatDate(value, selectedRange)}
              interval="preserveStartEnd"
              minTickGap={40}
              tickCount={6}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              fontSize={11} 
              tick={{ fill: '#64748b' }}
              tickFormatter={(value) => `$${value}`}
              width={55}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              formatter={(value: number, name: string) => {
                if (value === undefined || value === null) return ['N/A', name];
                if (name === 'price' || name === 'close') return [`$${value.toFixed(2)}`, '股價'];
                if (name === 'upper') return [`$${value.toFixed(2)}`, '布林上軌'];
                if (name === 'middle') return [`$${value.toFixed(2)}`, '中軌 (SMA 20)'];
                if (name === 'lower') return [`$${value.toFixed(2)}`, '布林下軌'];
                if (name === 'vwap') return [`$${value.toFixed(2)}`, 'VWAP'];
                return [`$${value.toFixed(2)}`, name];
              }}
              labelFormatter={(label) => {
                try {
                  if (!label) return '';
                  const date = new Date(label);
                  if (isNaN(date.getTime())) return label;
                  return date.toLocaleDateString();
                } catch (e) {
                  return label;
                }
              }}
            />
            
            {/* Bollinger Bands */}
            {hasBollingerBands && (
              <>
                {/* Upper Band - filled area to lower creates band */}
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#94a3b8" 
                  strokeWidth={1}
                  fill="url(#colorBollinger)"
                  fillOpacity={0.3}
                  dot={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#94a3b8" 
                  strokeWidth={1}
                  fill="#ffffff" 
                  fillOpacity={0.1}
                  dot={false}
                />
                {/* Middle Band (SMA 20) - dashed line */}
                <Line 
                  type="monotone" 
                  dataKey="middle" 
                  stroke="#f59e0b" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}
            
            {/* Price Line - main line */}
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
        <div style={{ display: 'flex', gap: '16px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '20px', height: '3px', background: '#2563eb', borderRadius: '2px' }}></div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>股價</span>
          </div>
          {hasBollingerBands && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '3px', background: '#f59e0b', borderRadius: '2px', borderStyle: 'dashed' }}></div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>中軌 (SMA 20)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '12px', background: '#94a3b8', borderRadius: '2px', opacity: 0.3 }}></div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>布林通道</span>
              </div>
            </>
          )}
          {hasVWAP && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '3px', background: '#f59e0b', borderRadius: '2px', borderStyle: 'dashed' }}></div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>VWAP</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};