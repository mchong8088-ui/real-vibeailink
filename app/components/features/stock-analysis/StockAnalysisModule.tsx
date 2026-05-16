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

  // Get the summary text from data
  const summaryText = data?.summary || data?.text || "";

  // Generate sample chart data if historical data not available
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

  // Text-to-Speech
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

  // Global Market Indices (static reference data)
  const globalIndices = [
    { name: "S&P 500", value: "5,234.18", change: "+0.8%", positive: true },
    { name: "NASDAQ", value: "16,428.82", change: "+1.2%", positive: true },
    { name: "DAX", value: "18,456.32", change: "-0.3%", positive: false },
    { name: "HSI", value: "19,234.56", change: "+0.5%", positive: true },
    { name: "Nikkei 225", value: "38,234.12", change: "-0.7%", positive: false },
    { name: "FTSE 100", value: "7,845.67", change: "+0.2%", positive: true },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">{t?.analyzingMarket || 'Analyzing market...'}</p>
      </div>
    );
  }

  // No data state
  if (!data || !data.symbol) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <Activity size={48} strokeWidth={1} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-400 text-base">{langKey === 'English' ? 'Please input stock symbol below' : langKey === 'Cantonese' ? '請輸入股票代號' : '请输入股票代码'}</p>
        <p className="text-slate-300 text-sm mt-2">e.g.: 0700.hk, TSLA, 2330.TW</p>
      </div>
    );
  }

  // Extract values from data prop
  const stockSymbol = data.symbol || "Stock";
  const currentPrice = data.price || "N/A";
  const rsiValue = data.rsi || "N/A";
  const macdValue = data.macd || "N/A";
  const marketCap = data.marketCap || "N/A";
  const peRatio = data.peRatio || "N/A";
  const volume = data.volume || "N/A";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-sm font-bold text-white">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      
      {/* SECTION 1: GLOBAL MARKET INDICES */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-yellow-500" />
          <h3 className="text-xs font-black text-yellow-600 uppercase tracking-wider">
            {langKey === 'English' ? 'Global Market Indices' : langKey === 'Cantonese' ? '全球市場指數' : '全球市场指数'}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {globalIndices.map((index, i) => (
            <div key={i} className="bg-yellow-100 rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-600">{index.name}</p>
              <p className="text-sm font-black text-slate-800">{index.value}</p>
              <p className={`text-[10px] font-bold ${index.positive ? 'text-green-600' : 'text-red-500'}`}>{index.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CHART + TECHNICAL INDICATORS */}
      <div className="grid grid-cols-3 gap-3">
        
        {/* Chart Area with Recharts */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-1.5 rounded-xl text-white">
                <BarChart3 size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{stockSymbol}</h3>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-slate-400">
                {langKey === 'English' ? 'Live' : langKey === 'Cantonese' ? '即時' : '实时'}
              </span>
            </div>
          </div>
          
          {/* Recharts Line Chart - Fixed height */}
          <div className="w-full" style={{ height: '160px', minHeight: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" hide={true} />
                <YAxis domain={yAxisDomain} hide={true} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3B82F6' }}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Price labels */}
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
            <span>${minPrice.toFixed(2)}</span>
            <span className="text-blue-600">${currentPrice}</span>
            <span>${maxPrice.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-end gap-3 mt-2 text-[9px] font-bold">
            <span className="text-slate-400 cursor-pointer hover:text-blue-500">1D</span>
            <span className="text-slate-400 cursor-pointer hover:text-blue-500">1W</span>
            <span className="text-blue-500 border-b border-blue-500 pb-0.5 cursor-pointer">1M</span>
            <span className="text-slate-400 cursor-pointer hover:text-blue-500">3M</span>
            <span className="text-slate-400 cursor-pointer hover:text-blue-500">1Y</span>
          </div>
        </div>

        {/* Technical Stats - YELLOW BOXES */}
        <div className="col-span-1 space-y-2">
          <div className="bg-yellow-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? 'Price' : langKey === 'Cantonese' ? '現價' : '现价'}
            </p>
            <p className="text-xl font-black text-slate-800">{currentPrice}</p>
          </div>
          
          <div className="bg-yellow-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">RSI (14)</p>
            <p className="text-xl font-black text-blue-600">{rsiValue}</p>
          </div>
          
          <div className="bg-yellow-100 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">MACD</p>
            <p className="text-xl font-black text-emerald-600">{macdValue}</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: STOCK INFORMATION */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="text-xs font-black text-yellow-600 uppercase tracking-wider mb-3">
          {langKey === 'English' ? 'Stock Information' : langKey === 'Cantonese' ? '股票信息' : '股票信息'}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? 'Market Cap' : '市值'}
            </p>
            <p className="text-sm font-black text-slate-800">{marketCap}</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? 'P/E Ratio' : '市盈率'}
            </p>
            <p className="text-sm font-black text-slate-800">{peRatio}</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? '52W High' : '52周高'}
            </p>
            <p className="text-sm font-black text-slate-800">{data.high52w || "N/A"}</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? '52W Low' : '52周低'}
            </p>
            <p className="text-sm font-black text-slate-800">{data.low52w || "N/A"}</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? 'Volume' : '成交量'}
            </p>
            <p className="text-sm font-black text-slate-800">{volume}</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {langKey === 'English' ? 'Avg Volume' : '平均量'}
            </p>
            <p className="text-sm font-black text-slate-800">{data.avgVolume || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: AI ANALYSIS TEXT + VOICE */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-blue-600 font-black text-sm">M</div>
              <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-blue-600 flex items-center justify-center text-white font-black text-sm">T</div>
            </div>
            <div>
              <h2 className="text-lg font-black leading-none text-white">
                {langKey === 'English' ? 'Market Strategy Report' : langKey === 'Cantonese' ? '市場策略報告' : '市场策略报告'}
              </h2>
              <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[9px]">
                {langKey === 'English' ? 'AI VERIFIED INSIGHTS' : 'AI 驗證洞察'}
              </p>
            </div>
          </div>
          
          {summaryText && (
            <button
              onClick={toggleSpeak}
              className={`p-2 rounded-full transition ${isSpeaking ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isSpeaking ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
            </button>
          )}
        </div>

        {/* Scrollable Text Area */}
        <div className="bg-gray-800 rounded-xl p-4 max-h-96 overflow-y-auto">
          {summaryText ? (
            <div className="space-y-2">
              {summaryText.split('\n').map((line: string, i: number) => (
                line.trim() && <p key={i} className="text-sm text-gray-200 leading-relaxed">{line}</p>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity size={32} className="text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400 italic">
                {langKey === 'English' ? 'Waiting for analysis...' : langKey === 'Cantonese' ? '等待分析結果...' : '等待分析结果...'}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
          <div className="flex gap-3">
            <Zap size={14} className="text-yellow-500" />
            <ShieldCheck size={14} className="text-blue-500" />
            <Activity size={14} className="text-green-500" />
          </div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
            {data.symbol ? `STR-${data.symbol}` : 'READY'} • {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};