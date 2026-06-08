"use client";
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface PriceChartProps {
  data: any[];
  langKey: string;
}

// Calculate Bollinger Bands - FIXED for read-only properties
const addBollingerBands = (data: any[], period: number = 20, multiplier: number = 2) => {
  if (!data || data.length < period) return data;
  
  // Create a deep copy to avoid read-only issues
  const result = data.map(item => ({ ...item }));
  const prices = result.map(d => d.price || d.close);
  
  for (let i = period - 1; i < result.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
    
    // Create new object with band properties
    result[i] = {
      ...result[i],
      upper: sma + (multiplier * stdDev),
      middle: sma,
      lower: sma - (multiplier * stdDev)
    };
  }
  
  return result;
};

export const PriceChart = ({ data, langKey }: PriceChartProps) => {
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '6M'>('3M');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // Filter data based on selected period and add Bollinger Bands
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }
    
    let daysToShow = 90;
    switch (period) {
      case '1D': daysToShow = 1; break;
      case '1W': daysToShow = 7; break;
      case '1M': daysToShow = 30; break;
      case '3M': daysToShow = 90; break;
      case '6M': daysToShow = 180; break;
    }
    
    const hasValidDates = data.some(item => item.date && !item.date.includes('d ago'));
    
    let filtered: any[];
    if (hasValidDates) {
      const cutoffDate = new Date();
      cutoffDate.setDate(new Date().getDate() - daysToShow);
      filtered = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
      });
      if (filtered.length === 0) filtered = data.slice(-Math.max(daysToShow, 20));
    } else {
      filtered = data.slice(-Math.max(daysToShow, 20));
    }
    
    const bandsAdded = addBollingerBands(filtered);
    setFilteredData(bandsAdded);
  }, [data, period]);
  
  const formatXAxis = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      if (period === '1D') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (period === '1W') {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    } catch (e) {
      return dateStr;
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const priceItem = payload.find((p: any) => p.dataKey === 'price' || p.dataKey === 'close');
      
      return (
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #E5E7EB', 
          borderRadius: '8px', 
          padding: '8px 12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '10px', color: '#6B7280', margin: '0 0 4px 0' }}>{label}</p>
          {priceItem && (
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563EB', margin: 0 }}>
              ${priceItem.value?.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  const getPeriodLabel = (p: string) => {
    if (langKey === 'Cantonese' || langKey === 'Traditional Chinese') {
      if (p === '1D') return '1日';
      if (p === '1W') return '1週';
      if (p === '1M') return '1月';
      if (p === '3M') return '3月';
      if (p === '6M') return '6月';
    } else if (langKey === 'Simplified Chinese') {
      if (p === '1D') return '1日';
      if (p === '1W') return '1周';
      if (p === '1M') return '1月';
      if (p === '3M') return '3月';
      if (p === '6M') return '6月';
    }
    return p;
  };
  
  if (filteredData.length === 0) {
    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #E5E7EB',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '12px'
      }}>
        <p style={{ color: '#6B7280', fontSize: '12px' }}>
          {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '圖表數據載入中...' : 
           langKey === 'Simplified Chinese' ? '图表数据加载中...' : 'Loading chart data...'}
        </p>
      </div>
    );
  }
  
  const minPrice = Math.min(...filteredData.map(d => d.price || d.close));
  const maxPrice = Math.max(...filteredData.map(d => d.price || d.close));
  const priceRange = maxPrice - minPrice;
  const yDomain = [minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1];
  
  return (
    <div style={{ 
      width: '100%', 
      background: 'white', 
      borderRadius: '12px', 
      border: '1px solid #E5E7EB',
      marginBottom: '12px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>
          {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '股價趨勢 (布林通道)' : 
           langKey === 'Simplified Chinese' ? '股价趋势 (布林通道)' : 'Price Trend (Bollinger Bands)'}
        </h4>
        
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['1D', '1W', '1M', '3M', '6M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: period === p ? '600' : '400',
                borderRadius: '6px',
                border: period === p ? '1px solid #2563EB' : '1px solid #E5E7EB',
                backgroundColor: period === p ? '#EFF6FF' : 'white',
                color: period === p ? '#2563EB' : '#6B7280',
                cursor: 'pointer'
              }}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: '12px', height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData}>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              fontSize={9}
              interval="preserveStartEnd"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              domain={yDomain}
              fontSize={9}
              width={40}
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
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
              fill="none" 
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
            
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 4, fill: '#2563eb' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ 
        padding: '6px 16px 10px', 
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        gap: '16px',
        fontSize: '9px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#2563eb' }} />
          <span style={{ color: '#6B7280' }}>
            {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '股價' : 
             langKey === 'Simplified Chinese' ? '股价' : 'Price'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#94a3b8', borderStyle: 'dashed' }} />
          <span style={{ color: '#6B7280' }}>SMA20</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '10px', backgroundColor: '#cbd5e1', opacity: 0.3 }} />
          <span style={{ color: '#6B7280' }}>
            {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '布林通道' : 
             langKey === 'Simplified Chinese' ? '布林通道' : 'Bollinger Bands'}
          </span>
        </div>
      </div>
    </div>
  );
};