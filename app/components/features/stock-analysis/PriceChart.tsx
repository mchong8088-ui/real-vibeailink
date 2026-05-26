"use client";
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface PriceChartProps {
  data: any[];
  langKey: string;
}

export const PriceChart = ({ data, langKey }: PriceChartProps) => {
  const [period, setPeriod] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');
  
  // Filter data based on period
  const getFilteredData = () => {
    const now = new Date();
    let daysToShow = 30; // Default 1M
    
    switch (period) {
      case '1W': daysToShow = 7; break;
      case '1M': daysToShow = 30; break;
      case '3M': daysToShow = 90; break;
      case '1Y': daysToShow = 365; break;
    }
    
    // If data has dates, filter by date
    if (data.length > 0 && data[0]?.date) {
      const cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - daysToShow);
      return data.filter(item => new Date(item.date) >= cutoffDate);
    }
    
    // If no dates or mock data, just return last N items
    return data.slice(-daysToShow);
  };
  
  const filteredData = getFilteredData();
  
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '1W') {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else if (period === '1M') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return (
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #E5E7EB', 
          borderRadius: '8px', 
          padding: '8px 12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 4px 0' }}>
            {formattedDate}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563EB', margin: 0 }}>
            ${payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  const periodLabels = {
    '1W': langKey === 'Cantonese' ? '1週' : langKey === '简体中文' ? '1周' : '1W',
    '1M': langKey === 'Cantonese' ? '1月' : langKey === '简体中文' ? '1月' : '1M',
    '3M': langKey === 'Cantonese' ? '3月' : langKey === '简体中文' ? '3月' : '3M',
    '1Y': langKey === 'Cantonese' ? '1年' : langKey === '简体中文' ? '1年' : '1Y',
  };
  
  return (
    <div style={{ 
      width: '100%', 
      background: 'white', 
      borderRadius: '12px', 
      border: '1px solid #E5E7EB',
      marginBottom: '12px',
      overflow: 'hidden'
    }}>
      {/* Header with period selector */}
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
          {langKey === 'Cantonese' ? '股價趨勢' : langKey === '简体中文' ? '股价趋势' : 'Price Trend'}
        </h4>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['1W', '1M', '3M', '1Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: period === p ? '600' : '400',
                borderRadius: '6px',
                border: period === p ? '1px solid #2563EB' : '1px solid #E5E7EB',
                backgroundColor: period === p ? '#EFF6FF' : 'white',
                color: period === p ? '#2563EB' : '#6B7280',
                cursor: 'pointer'
              }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ padding: '12px', height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              fontSize={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['auto', 'auto']} 
              fontSize={10}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="upper" stroke="none" fill="#e2e8f0" fillOpacity={0.3} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />
            <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="vwap" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div style={{ 
        padding: '8px 16px 12px', 
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        gap: '16px',
        fontSize: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#2563eb' }} />
          <span style={{ color: '#6B7280' }}>Price</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#f59e0b', borderStyle: 'dashed' }} />
          <span style={{ color: '#6B7280' }}>VWAP</span>
        </div>
      </div>
    </div>
  );
};
