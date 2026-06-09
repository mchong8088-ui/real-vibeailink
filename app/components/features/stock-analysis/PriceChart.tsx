"use client";
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface PriceChartProps {
  data: any[];
  langKey: string;
}

// Calculate Bollinger Bands
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
  // Use all data (already filtered to 3 months from parent)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return addBollingerBands(data);
  }, [data]);
  
  const formatXAxis = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return dateStr;
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const priceItem = payload.find((p: any) => p.dataKey === 'price' || p.dataKey === 'close');
      const middleItem = payload.find((p: any) => p.dataKey === 'middle');
      
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
          {middleItem && middleItem.value && (
            <p style={{ fontSize: '10px', color: '#6B7280', margin: '4px 0 0 0' }}>
              SMA20: ${middleItem.value?.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  if (chartData.length === 0) {
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
  
  const minPrice = Math.min(...chartData.map(d => d.price || d.close));
  const maxPrice = Math.max(...chartData.map(d => d.price || d.close));
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
          {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '股價走勢圖 (最近3個月) - 布林通道' : 
           langKey === 'Simplified Chinese' ? '股价走势图 (最近3个月) - 布林通道' : 'Price Chart (Last 3 Months) - Bollinger Bands'}
        </h4>
      </div>
      
      <div style={{ padding: '12px', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
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
            
            {/* Bollinger Bands - Fill between upper and lower */}
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
            
            {/* Middle Band (SMA 20) */}
            <Line 
              type="monotone" 
              dataKey="middle" 
              stroke="#94a3b8" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={false}
            />
            
            {/* Price Line */}
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
      
      {/* Legend */}
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
          <span style={{ color: '#6B7280' }}>SMA20 (中軌)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '10px', backgroundColor: '#cbd5e1', opacity: 0.3 }} />
          <span style={{ color: '#6B7280' }}>
            {langKey === 'Cantonese' || langKey === 'Traditional Chinese' ? '布林通道 (上/下軌)' : 
             langKey === 'Simplified Chinese' ? '布林通道 (上/下轨)' : 'Bollinger Bands (Upper/Lower)'}
          </span>
        </div>
      </div>
    </div>
  );
};