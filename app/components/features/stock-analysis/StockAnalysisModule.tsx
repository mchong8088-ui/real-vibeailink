"use client";
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: any;
  isLoading: boolean;
  langKey: string;
  t: any;
  onAnalyze?: (ticker: string, language: string) => void; // Add this
}

export const StockAnalysisModule: React.FC<Props> = ({ data, isLoading, langKey, t, onAnalyze }) => {
  
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

  // Fixed display for last 3 months of data
  const chartData = useMemo(() => {
    const historical = data?.historical;
    if (!historical || historical.length === 0) {
      return [];
    }
    
    // Take last 90 days of data (about 3 months)
    const threeMonthsData = historical.slice(-90);
    
    return threeMonthsData.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      price: item.close,
    }));
  }, [data?.historical]);

  // Helper function to get Chinese text based on language
  const getChineseText = (text: string): string => {
    if (langKey === 'Cantonese' || langKey === '简体中文') {
      const translations: Record<string, string> = {
        'Bullish': '看好',
        'Bearish': '看淡',
        'Neutral': '中性',
        'Uptrend': '上升通道',
        'Downtrend': '下降通道',
        'Sideways': '區間震盪',
        'Price': '股價',
        'Trend': '趨勢',
        'Volume': '成交量',
        'Avg Volume': '平均成交量',
        'Volatility': '波動率',
        'Day Range': '日內波幅',
        'Change': '漲跌幅',
        'Market Cap': '市值',
        'P/E Ratio': '市盈率',
        'EPS': '每股盈利',
        'Revenue Growth': '收入增長',
        'Profit Margin': '利潤率',
        'Debt Ratio': '負債權益比',
        'Dividend Yield': '股息率'
      };
      return translations[text] || text;
    }
    return text;
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ color: '#6B7280' }}>{langKey === 'Cantonese' ? '分析中...' : langKey === '简体中文' ? '分析中...' : 'Analyzing...'}</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF' }}>{langKey === 'Cantonese' ? '輸入股票代號開始分析' : langKey === '简体中文' ? '输入股票代码开始分析' : 'Enter stock symbol to start analysis'}</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>例如: 2330.TW, 0700.HK, TSLA</p>
      </div>
    );
  }

  const isPositive = data.changePercent > 0;
  const priceDisplay = data.price ? `${data.price.toFixed(2)}` : 'N/A';
  const changeDisplay = data.changePercent ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : 'N/A';
  const rsiDisplay = data.rsi ? data.rsi.toFixed(1) : 'N/A';
  
  // Get Chinese text for MACD and Trend (if language is Chinese)
  const macdDisplay = (langKey === 'Cantonese' || langKey === '简体中文') ? getChineseText(data.macd || 'Neutral') : (data.macd || 'Neutral');
  const trendDisplay = (langKey === 'Cantonese' || langKey === '简体中文') ? getChineseText(data.trend || 'Sideways') : (data.trend || 'Sideways');
  
  // Get additional metrics
  const sma20Display = data.sma20 ? `${data.currency || '$'}${data.sma20.toFixed(2)}` : 'N/A';
  const sma50Display = data.sma50 ? `${data.currency || '$'}${data.sma50.toFixed(2)}` : 'N/A';
  const volatilityDisplay = data.volatility ? `${(data.volatility * 100).toFixed(2)}%` : 'N/A';
  const avgVolumeDisplay = data.avgVolume ? data.avgVolume.toLocaleString() : 'N/A';
  const dayLowDisplay = data.dayLow ? `${data.currency || '$'}${data.dayLow.toFixed(2)}` : 'N/A';
  const dayHighDisplay = data.dayHigh ? `${data.currency || '$'}${data.dayHigh.toFixed(2)}` : 'N/A';

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
      {/* Global Market Indices */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px' }}>🌍</span>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#B45309', margin: 0 }}>{langKey === 'Cantonese' ? '全球市場指數' : langKey === '简体中文' ? '全球市场指数' : 'Global Market Indices'}</h3>
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

      {/* Stock Info Bar - Expanded with more metrics */}
      <div style={{ backgroundColor: '#FEF08A', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
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
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{langKey === 'Cantonese' || langKey === '简体中文' ? '股價' : 'Price'}</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{currencySymbol}{priceDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>RSI(14)</p>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6', margin: 0 }}>{rsiDisplay}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>MACD</p>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: data.macd === 'Bullish' ? '#10B981' : data.macd === 'Bearish' ? '#EF4444' : '#6B7280' }}>
                {macdDisplay}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{langKey === 'Cantonese' || langKey === '简体中文' ? '趨勢' : 'Trend'}</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {data.trend === 'Uptrend' ? '📈' : data.trend === 'Downtrend' ? '📉' : '➡️'} {trendDisplay}
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional Metrics Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #E5E7EB', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>SMA20</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{sma20Display}</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>SMA50</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{sma50Display}</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>{langKey === 'Cantonese' || langKey === '简体中文' ? '波動率' : 'Volatility'}</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{volatilityDisplay}</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>{langKey === 'Cantonese' || langKey === '简体中文' ? '平均成交量' : 'Avg Volume'}</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{avgVolumeDisplay}</p>
          </div>
          <div>
            <p style={{ fontSize: '9px', color: '#6B7280', margin: 0 }}>{langKey === 'Cantonese' || langKey === '简体中文' ? '日內波幅' : 'Day Range'}</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>{dayLowDisplay} - {dayHighDisplay}</p>
          </div>
        </div>
      </div>

      {/* Price Chart - Fixed 3 months */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px' }}>{langKey === 'Cantonese' ? '價格走勢圖 (最近3個月)' : langKey === '简体中文' ? '价格走势图 (最近3个月)' : 'Price Chart (Last 3 Months)'}</h4>
        {chartData.length > 0 ? (
          <>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickFormatter={formatXTick} fontSize={10} interval={0} tick={{ fill: '#6B7280' }} />
                  <YAxis domain={[minPrice * 0.95, maxPrice * 1.05]} fontSize={10} width={45} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="price" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#2563EB' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
              <span>{langKey === 'Cantonese' ? '區間' : langKey === '简体中文' ? '区间' : 'Range'}: {currencySymbol}{minPrice.toFixed(2)} - {currencySymbol}{maxPrice.toFixed(2)}</span>
              <span>{langKey === 'Cantonese' ? '數據期間' : langKey === '简体中文' ? '数据期间' : 'Data Period'}: {langKey === 'Cantonese' ? '最近90天' : langKey === '简体中文' ? '最近90天' : 'Last 90 Days'}</span>
            </div>
          </>
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#9CA3AF' }}>{langKey === 'Cantonese' ? '圖表數據載入中...' : langKey === '简体中文' ? '图表数据加载中...' : 'Loading chart data...'}</p>
          </div>
        )}
      </div>

      {/* Analysis Report */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>{data.summary}</div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
          <span>AI Analysis • {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};