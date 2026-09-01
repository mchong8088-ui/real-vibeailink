"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, Scan, Sparkles } from 'lucide-react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
  langKey: string;
}

interface StockData {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  rsi: number | null;
  macd: string;
  trend: string;
  currency: string;
  companyName?: string;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  isFallback?: boolean;
  marketState?: string;
  error?: string;
}

type SortOption = 'symbol' | 'price' | 'change' | 'rsi' | 'trend' | 'default';

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  langKey,
}) => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [newStock, setNewStock] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      console.log('📋 Watchlist modal opened');
      const saved = localStorage.getItem('stockWatchlist');
      console.log('📋 Saved watchlist from localStorage:', saved);
      
      if (saved) {
        try {
          const list = JSON.parse(saved);
          console.log('📋 Parsed watchlist:', list);
          setWatchlist(list);
          
          if (list.length > 0) {
            fetchRealStockData(list);
          }
        } catch (e) {
          console.error('Error parsing watchlist:', e);
          setWatchlist([]);
        }
      } else {
        console.log('📋 No watchlist found in localStorage');
        setWatchlist([]);
      }
      
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          setCredits(profile.credits || 0);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const fetchRealStockData = async (symbols: string[]) => {
    console.log('📊 Fetching real data for:', symbols);
    
    const loadingState: Record<string, boolean> = {};
    symbols.forEach(s => { loadingState[s] = true; });
    setLoading(loadingState);
    setIsLoadingData(true);
    setError(null);

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
        cache: 'no-store'
      });

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data) {
        const dataMap: Record<string, StockData> = {};
        let hasError = false;
        
        result.data.forEach((item: StockData) => {
          dataMap[item.symbol] = item;
          if (item.error || item.isFallback) {
            hasError = true;
          }
          console.log(`✅ Data for ${item.symbol}:`, item);
        });
        
        setStockData(dataMap);
        
        const hasErrors = result.data.some((item: StockData) => item.error || item.isFallback);
        if (hasErrors) {
          setError('Some stocks could not be loaded. Please try refreshing.');
        }
        
        if (result.data.length === 0) {
          setError('Unable to load stock data. Please try again.');
        }
      } else {
        setError(result.error || 'Failed to load stock data. Please try again.');
        setStockData({});
      }
    } catch (error) {
      console.error('❌ Error fetching real data:', error);
      setError('Network error. Please check your connection and try again.');
      setStockData({});
    } finally {
      const loadingStateClear: Record<string, boolean> = {};
      symbols.forEach(s => { loadingStateClear[s] = false; });
      setLoading(loadingStateClear);
      setIsLoadingData(false);
    }
  };

  const handleRefresh = () => {
    if (watchlist.length === 0) return;
    setIsRefreshing(true);
    fetchRealStockData(watchlist);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleScanAll = async () => {
    if (watchlist.length === 0 || isScanning) return;
    
    setIsScanning(true);
    setScanning(true);
    
    try {
      await fetchRealStockData(watchlist);
      
      const signals: string[] = [];
      const data = stockData;
      
      watchlist.forEach(symbol => {
        const stock = data[symbol];
        if (stock && stock.rsi !== null && !stock.error) {
          if (stock.rsi < 30) {
            signals.push(`🟢 ${symbol} - RSI ${stock.rsi.toFixed(1)} (Oversold) - BUY signal`);
          } else if (stock.rsi > 70) {
            signals.push(`🔴 ${symbol} - RSI ${stock.rsi.toFixed(1)} (Overbought) - SELL signal`);
          } else {
            signals.push(`⚪ ${symbol} - RSI ${stock.rsi.toFixed(1)} (Neutral) - HOLD`);
          }
        } else if (stock && stock.error) {
          signals.push(`⚠️ ${symbol} - ${stock.error}`);
        } else {
          signals.push(`⚪ ${symbol} - No data available`);
        }
      });
      
      setScanResults(signals);
      
      setTimeout(() => {
        setScanning(false);
      }, 5000);
      
    } catch (error) {
      console.error('Scan error:', error);
      setError('Error scanning stocks. Please try again.');
      setScanning(false);
    } finally {
      setIsScanning(false);
    }
  };

  const getSortedWatchlist = useMemo(() => {
    if (sortBy === 'default') return watchlist;
    
    return [...watchlist].sort((a, b) => {
      const dataA = stockData[a];
      const dataB = stockData[b];
      
      if (!dataA || dataA.error) return 1;
      if (!dataB || dataB.error) return -1;
      
      switch (sortBy) {
        case 'symbol':
          return a.localeCompare(b);
        case 'price':
          return (dataB.price || 0) - (dataA.price || 0);
        case 'change':
          return (dataB.changePercent || 0) - (dataA.changePercent || 0);
        case 'rsi':
          if (dataA.rsi === null) return 1;
          if (dataB.rsi === null) return -1;
          return (dataB.rsi || 0) - (dataA.rsi || 0);
        case 'trend':
          const trendOrder = { 'Uptrend': 1, 'Sideways': 2, 'Downtrend': 3 };
          return (trendOrder[dataA.trend as keyof typeof trendOrder] || 0) - 
                 (trendOrder[dataB.trend as keyof typeof trendOrder] || 0);
        default:
          return 0;
      }
    });
  }, [watchlist, stockData, sortBy]);

  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    localStorage.setItem('stockWatchlist', JSON.stringify(newList));
    console.log('💾 Saved watchlist:', newList);
  };

  const addStock = () => {
    const symbol = newStock.trim().toUpperCase();
    if (!symbol) return;
    if (watchlist.includes(symbol)) {
      alert('Stock already in watchlist');
      return;
    }
    if (watchlist.length >= 10) {
      alert('Watchlist limit is 10 stocks');
      return;
    }
    const newList = [...watchlist, symbol];
    saveWatchlist(newList);
    setNewStock('');
    fetchRealStockData(newList);
  };

  const removeStock = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newList = watchlist.filter(s => s !== symbol);
    saveWatchlist(newList);
    const newData = { ...stockData };
    delete newData[symbol];
    setStockData(newData);
  };

  const getRSIStatus = (rsi: number | null) => {
    if (rsi === null || rsi === undefined) return { color: '#9CA3AF', text: '⚪', label: 'N/A' };
    if (rsi < 30) return { color: '#22C55E', text: '🟢', label: 'BUY' };
    if (rsi > 70) return { color: '#EF4444', text: '🔴', label: 'SELL' };
    return { color: '#9CA3AF', text: '⚪', label: 'HOLD' };
  };

  const getMACDStatus = (macd: string) => {
    if (macd === 'Bullish') return { color: '#22C55E', text: '🟢' };
    if (macd === 'Bearish') return { color: '#EF4444', text: '🔴' };
    return { color: '#9CA3AF', text: '⚪' };
  };

  const getTrendDisplay = (trend: string) => {
    if (trend === 'Uptrend') return { icon: '📈', color: '#22C55E' };
    if (trend === 'Downtrend') return { icon: '📉', color: '#EF4444' };
    return { icon: '➡️', color: '#9CA3AF' };
  };

  const getText = () => {
    if (langKey === 'Traditional Chinese') {
      return {
        title: '我的關注列表',
        limit: '最多10隻股票',
        addPlaceholder: '輸入股票代號 (如: TSLA)',
        add: '新增',
        empty: '暫無追蹤股票',
        addHint: '輸入代號並點擊 + 新增',
        max: '已達上限',
        price: '價格',
        change: '漲跌',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: '趨勢',
        legendTitle: '📊 信號說明',
        legendBuy: '🟢 綠色 = RSI低於30 (超賣) - 考慮買入',
        legendSell: '🔴 紅色 = RSI高於70 (超買) - 考慮賣出',
        legendNeutral: '⚪ 灰色 = RSI 30-70 (中性) - 持有觀望',
        refresh: '刷新',
        scanAll: '掃描全部',
        sortBy: '排序',
        goToAI: 'AI 股票分析',
        loadingData: '載入中...',
        noData: '無數據',
        clickToAnalyze: '點擊查看完整分析',
        fetchingData: '獲取數據中...',
        remove: '移除',
        error: '載入失敗，請重試',
        credits: '積分',
        sortOptions: {
          default: '默認排序',
          symbol: '按代號',
          price: '按價格',
          change: '按漲跌',
          rsi: '按RSI',
          trend: '按趨勢'
        },
        scanning: '掃描中...',
        scanResults: '掃描結果',
        realtime: '即時數據'
      };
    } else if (langKey === 'Simplified Chinese') {
      return {
        title: '我的关注列表',
        limit: '最多10只股票',
        addPlaceholder: '输入股票代码 (如: TSLA)',
        add: '新增',
        empty: '暂无追踪股票',
        addHint: '输入代码并点击 + 新增',
        max: '已达上限',
        price: '价格',
        change: '涨跌',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: '趋势',
        legendTitle: '📊 信号说明',
        legendBuy: '🟢 绿色 = RSI低于30 (超卖) - 考虑买入',
        legendSell: '🔴 红色 = RSI高于70 (超买) - 考虑卖出',
        legendNeutral: '⚪ 灰色 = RSI 30-70 (中性) - 持有观望',
        refresh: '刷新',
        scanAll: '扫描全部',
        sortBy: '排序',
        goToAI: 'AI 股票分析',
        loadingData: '载入中...',
        noData: '无数据',
        clickToAnalyze: '点击查看完整分析',
        fetchingData: '获取数据中...',
        remove: '移除',
        error: '载入失败，请重试',
        credits: '积分',
        sortOptions: {
          default: '默认排序',
          symbol: '按代码',
          price: '按价格',
          change: '按涨跌',
          rsi: '按RSI',
          trend: '按趋势'
        },
        scanning: '扫描中...',
        scanResults: '扫描结果',
        realtime: '实时数据'
      };
    } else {
      return {
        title: 'My Watchlist',
        limit: 'Max 10 stocks',
        addPlaceholder: 'Enter stock symbol (e.g., TSLA)',
        add: 'Add',
        empty: 'No stocks in watchlist',
        addHint: 'Enter symbol and click + to add',
        max: 'Limit reached',
        price: 'Price',
        change: 'Change',
        rsi: 'RSI(14)',
        macd: 'MACD',
        trend: 'Trend',
        legendTitle: '📊 Signal Legend',
        legendBuy: '🟢 Green = RSI below 30 (Oversold) - Consider BUY',
        legendSell: '🔴 Red = RSI above 70 (Overbought) - Consider SELL',
        legendNeutral: '⚪ Gray = RSI 30-70 (Neutral) - HOLD',
        refresh: 'Refresh',
        scanAll: 'Scan All',
        sortBy: 'Sort By',
        goToAI: 'Go to AI Stock',
        loadingData: 'Loading...',
        noData: 'No data',
        clickToAnalyze: 'Click to view full analysis',
        fetchingData: 'Fetching data...',
        remove: 'Remove',
        error: 'Failed to load data',
        credits: 'Credits',
        sortOptions: {
          default: 'Default',
          symbol: 'Symbol',
          price: 'Price',
          change: 'Change %',
          rsi: 'RSI',
          trend: 'Trend'
        },
        scanning: 'Scanning...',
        scanResults: 'Scan Results',
        realtime: 'Real-time'
      };
    }
  };

  const t = getText();

  if (!isOpen) return null;

  const hasStocks = watchlist.length > 0;
  const isLoading = Object.values(loading).some(v => v === true) || isLoadingData;
  const sortedWatchlist = getSortedWatchlist;
  const hasValidData = Object.values(stockData).some(data => data && data.price > 0 && !data.error);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      paddingTop: '60px',
      overflow: 'hidden'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '24px',
        paddingBottom: '30px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        position: 'relative',
        marginTop: '10px'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 10,
          paddingBottom: '12px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {t.title}
            </h3>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>({watchlist.length}/10)</span>
            {credits > 0 && (
              <span style={{ 
                fontSize: '11px', 
                color: '#059669', 
                backgroundColor: '#D1FAE5', 
                padding: '2px 10px', 
                borderRadius: '12px',
                fontWeight: '600'
              }}>
                #{t.credits}: {credits}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleScanAll}
              disabled={isScanning || !hasStocks || isLoading}
              style={{
                padding: '6px 10px',
                backgroundColor: isScanning || !hasStocks || isLoading ? '#9CA3AF' : '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isScanning || !hasStocks || isLoading ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isScanning || !hasStocks || isLoading ? 0.6 : 1
              }}
            >
              <Scan size={14} /> {isScanning ? t.scanning : t.scanAll}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                disabled={!hasStocks || isLoading}
                style={{
                  padding: '6px 10px',
                  backgroundColor: !hasStocks || isLoading ? '#9CA3AF' : '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !hasStocks || isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: !hasStocks || isLoading ? 0.6 : 1
                }}
              >
                <ArrowUpDown size={14} /> {t.sortBy}
              </button>
              {isSortMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #E5E7EB',
                  zIndex: 20,
                  minWidth: '140px',
                  overflow: 'hidden'
                }}>
                  {Object.entries(t.sortOptions).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key as SortOption);
                        setIsSortMenuOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 14px',
                        border: 'none',
                        background: sortBy === key ? '#F3F4F6' : 'transparent',
                        color: '#1F2937',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                      onMouseLeave={(e) => { 
                        if (sortBy !== key) e.currentTarget.style.backgroundColor = 'transparent'; 
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                const analysisTab = document.querySelector('[data-view="analysis"]');
                if (analysisTab) {
                  (analysisTab as HTMLElement).click();
                }
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={14} /> {t.goToAI}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !hasStocks || isLoading}
              style={{
                padding: '6px 10px',
                backgroundColor: isRefreshing || !hasStocks || isLoading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing || !hasStocks || isLoading ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isRefreshing || !hasStocks || isLoading ? 0.6 : 1
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> {t.refresh}
            </button>

            <button
              onClick={onClose}
              style={{ 
                background: '#F3F4F6',
                border: 'none',
                cursor: 'pointer',
                color: '#374151',
                padding: '6px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                minHeight: '36px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add Stock Input */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <input
            type="text"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder={t.addPlaceholder}
            onKeyPress={(e) => e.key === 'Enter' && addStock()}
            disabled={watchlist.length >= 10 || isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#F9FAFB'
            }}
          />
          <button
            onClick={addStock}
            disabled={watchlist.length >= 10 || isLoading}
            style={{
              padding: '10px 18px',
              backgroundColor: watchlist.length >= 10 || isLoading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: watchlist.length >= 10 || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={16} /> {t.add}
          </button>
        </div>

        {/* Scan Results */}
        {scanning && scanResults.length > 0 && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#065F46', marginBottom: '6px' }}>
              🔍 {t.scanResults}
            </div>
            {scanResults.map((result, index) => (
              <div key={index} style={{ fontSize: '12px', color: '#1F2937', padding: '2px 0' }}>
                {result}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            marginBottom: '12px',
            color: '#DC2626',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Real-time indicator */}
        {hasStocks && !isLoading && hasValidData && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '8px',
            fontSize: '10px',
            color: '#6B7280'
          }}>
            <span>🟢 {t.realtime}</span>
          </div>
        )}

        {/* Content */}
        {!hasStocks ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '48px', margin: 0 }}>📭</p>
            <p style={{ fontSize: '15px', marginTop: '12px' }}>{t.empty}</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>{t.addHint}</p>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
            <p style={{ fontSize: '14px' }}>⏳ {t.fetchingData}</p>
          </div>
        ) : !hasValidData ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
            <p style={{ fontSize: '14px' }}>📊 {t.noData}</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Click refresh to try again</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {sortedWatchlist.map((symbol) => {
              const data = stockData[symbol];
              const isLoadingStock = loading[symbol];
              const isFallback = data?.isFallback || false;
              const hasError = data?.error || false;
              const rsiStatus = data?.rsi !== undefined && data?.rsi !== null ? getRSIStatus(data.rsi) : getRSIStatus(null);
              const macdStatus = data?.macd ? getMACDStatus(data.macd) : getMACDStatus('Neutral');
              const trendDisplay = data?.trend ? getTrendDisplay(data.trend) : getTrendDisplay('Sideways');

              return (
                <div
                  key={symbol}
                  onClick={() => {
                    if (!hasError && data?.price > 0) {
                      console.log('🔍 Selected stock:', symbol);
                      onSelectStock(symbol);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '14px 16px',
                    backgroundColor: hasError ? '#FEF2F2' : isFallback ? '#FFFBEB' : '#F9FAFB',
                    borderRadius: '12px',
                    border: hasError ? '1px solid #FCA5A5' : isFallback ? '1px solid #FCD34D' : '1px solid #E5E7EB',
                    cursor: hasError ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: hasError ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!hasError) {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasError) {
                      e.currentTarget.style.backgroundColor = hasError ? '#FEF2F2' : isFallback ? '#FFFBEB' : '#F9FAFB';
                      e.currentTarget.style.borderColor = hasError ? '#FCA5A5' : isFallback ? '#FCD34D' : '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                        {symbol}
                      </span>
                      {data?.companyName && data.companyName !== symbol && !hasError && (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {data.companyName}
                        </span>
                      )}
                      {isFallback && !hasError && (
                        <span style={{ fontSize: '10px', color: '#D97706', backgroundColor: '#FEF3C7', padding: '1px 8px', borderRadius: '4px' }}>
                          ⚠️ sample
                        </span>
                      )}
                      {hasError && (
                        <span style={{ fontSize: '10px', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '1px 8px', borderRadius: '4px' }}>
                          ⚠️ error
                        </span>
                      )}
                      {isLoadingStock && (
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>⏳</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => removeStock(symbol, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#EF4444',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Trash2 size={14} /> {t.remove}
                    </button>
                  </div>

                  {isLoadingStock ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: '#9CA3AF' }}>
                      <span style={{ fontSize: '13px' }}>⏳ {t.loadingData}</span>
                    </div>
                  ) : hasError ? (
                    <div style={{ padding: '8px 0', textAlign: 'center', color: '#DC2626', fontSize: '12px' }}>
                      ⚠️ {data?.error || t.error}
                    </div>
                  ) : data && data.price > 0 ? (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      {/* Price */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {t.price}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937' }}>
                          {data.currency}{data.price.toFixed(2)}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: data.changePercent >= 0 ? '#22C55E' : '#EF4444'
                        }}>
                          {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      {/* RSI */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {t.rsi}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: rsiStatus.color }}>
                            {data.rsi !== null ? data.rsi.toFixed(1) : 'N/A'}
                          </span>
                          <span style={{ fontSize: '18px' }}>{rsiStatus.text}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: rsiStatus.color, fontWeight: '600' }}>
                          {data.rsi !== null ? rsiStatus.label : t.noData}
                        </div>
                      </div>

                      {/* MACD */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {t.macd}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: macdStatus.color }}>
                            {data.macd}
                          </span>
                          <span style={{ fontSize: '18px' }}>{macdStatus.text}</span>
                        </div>
                      </div>

                      {/* Trend */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {t.trend}
                        </div>
                        <div style={{ fontSize: '24px', color: trendDisplay.color }}>
                          {trendDisplay.icon}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '500', color: trendDisplay.color }}>
                          {data.trend}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 0', textAlign: 'center', color: '#EF4444', fontSize: '12px' }}>
                      {t.error || 'No data available'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {hasStocks && hasValidData && !isLoading && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px', color: '#374151' }}>
              {t.legendTitle}
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '4px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#22C55E', fontSize: '18px' }}>🟢</span>
                <span style={{ fontSize: '11px', color: '#4B5563' }}>{t.legendBuy}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#EF4444', fontSize: '18px' }}>🔴</span>
                <span style={{ fontSize: '11px', color: '#4B5563' }}>{t.legendSell}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#9CA3AF', fontSize: '18px' }}>⚪</span>
                <span style={{ fontSize: '11px', color: '#4B5563' }}>{t.legendNeutral}</span>
              </div>
            </div>
            <div style={{ 
              marginTop: '6px', 
              fontSize: '10px', 
              color: '#9CA3AF',
              borderTop: '1px solid #E5E7EB',
              paddingTop: '6px',
              textAlign: 'center'
            }}>
              💡 {t.clickToAnalyze}
            </div>
          </div>
        )}

        {watchlist.length === 10 && (
          <div style={{ padding: '8px 16px', backgroundColor: '#FEF3C7', textAlign: 'center', borderRadius: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: '#92400E' }}>⚠️ {t.max}</span>
          </div>
        )}
      </div>
    </div>
  );
};