"use client";
import React, { useState, useEffect } from 'react';
import { X, Star, RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
  langKey: string;
}

interface StockData {
  symbol: string;
  price: number;
  changePercent: number;
  rsi: number | null;
  macd: string;
  trend: string;
  currency: string;
  companyName?: string;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
}

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

  // Load watchlist from localStorage and fetch real data
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
    }
  }, [isOpen]);

  // Fetch real stock data from the API
  const fetchRealStockData = async (symbols: string[]) => {
    console.log('📊 Fetching real data for:', symbols);
    
    // Set loading state
    const loadingState: Record<string, boolean> = {};
    symbols.forEach(s => { loadingState[s] = true; });
    setLoading(loadingState);
    setIsLoadingData(true);
    setError(null);

    try {
      // Call the watchlist API endpoint
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data) {
        const dataMap: Record<string, StockData> = {};
        result.data.forEach((item: StockData) => {
          dataMap[item.symbol] = item;
          console.log(`✅ Data for ${item.symbol}:`, item);
        });
        setStockData(dataMap);
        
        if (result.data.length === 0) {
          setError('Unable to load stock data. Please try again.');
        }
      } else {
        console.warn('⚠️ API returned error, falling back to mock data');
        // Fallback to mock data if API fails
        generateMockData(symbols);
      }
    } catch (error) {
      console.error('❌ Error fetching real data:', error);
      // Fallback to mock data on error
      generateMockData(symbols);
    } finally {
      const loadingStateClear: Record<string, boolean> = {};
      symbols.forEach(s => { loadingStateClear[s] = false; });
      setLoading(loadingStateClear);
      setIsLoadingData(false);
    }
  };

  // Mock data as fallback when API fails
  const generateMockData = (symbols: string[]) => {
    console.log('📊 Generating mock data as fallback for:', symbols);
    
    const dataMap: Record<string, StockData> = {};
    
    const mockData: Record<string, any> = {
      'TSLA': { price: 313.03, changePercent: -1.47, rsi: 27.3, macd: 'Bearish', trend: 'Downtrend', currency: '$', companyName: 'Tesla, Inc.' },
      'NBIS': { price: 169.69, changePercent: -9.68, rsi: 35.1, macd: 'Bearish', trend: 'Downtrend', currency: '$', companyName: 'Nebius Group' },
      'SPCX': { price: 12.45, changePercent: 3.21, rsi: 62.5, macd: 'Bullish', trend: 'Uptrend', currency: '$', companyName: 'SPAC X' },
      'AAPL': { price: 175.34, changePercent: 0.85, rsi: 48.2, macd: 'Neutral', trend: 'Sideways', currency: '$', companyName: 'Apple Inc.' },
      '0700.HK': { price: 345.60, changePercent: -0.52, rsi: 44.6, macd: 'Neutral', trend: 'Sideways', currency: 'HK$', companyName: 'Tencent Holdings' },
      '2330.TW': { price: 542.00, changePercent: 1.23, rsi: 55.8, macd: 'Bullish', trend: 'Uptrend', currency: 'NT$', companyName: 'Taiwan Semiconductor' },
    };
    
    symbols.forEach(symbol => {
      if (mockData[symbol]) {
        dataMap[symbol] = {
          symbol: symbol,
          ...mockData[symbol]
        };
      } else {
        dataMap[symbol] = {
          symbol: symbol,
          price: 0,
          changePercent: 0,
          rsi: null,
          macd: 'Neutral',
          trend: 'Sideways',
          currency: '$',
          companyName: symbol,
        };
      }
    });
    
    setStockData(dataMap);
    setError('Using sample data. Please try refreshing.');
  };

  // Refresh data - fetch real data again
  const handleRefresh = () => {
    if (watchlist.length === 0) return;
    setIsRefreshing(true);
    fetchRealStockData(watchlist);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Save watchlist
  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    localStorage.setItem('stockWatchlist', JSON.stringify(newList));
    console.log('💾 Saved watchlist:', newList);
  };

  // Add stock
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

  // Remove stock
  const removeStock = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newList = watchlist.filter(s => s !== symbol);
    saveWatchlist(newList);
    const newData = { ...stockData };
    delete newData[symbol];
    setStockData(newData);
  };

  // Get RSI status
  const getRSIStatus = (rsi: number | null) => {
    if (rsi === null || rsi === undefined) return { color: '#9CA3AF', text: '⚪', label: 'N/A' };
    if (rsi < 30) return { color: '#22C55E', text: '🟢', label: 'BUY' };
    if (rsi > 70) return { color: '#EF4444', text: '🔴', label: 'SELL' };
    return { color: '#9CA3AF', text: '⚪', label: 'HOLD' };
  };

  // Get MACD status
  const getMACDStatus = (macd: string) => {
    if (macd === 'Bullish') return { color: '#22C55E', text: '🟢' };
    if (macd === 'Bearish') return { color: '#EF4444', text: '🔴' };
    return { color: '#9CA3AF', text: '⚪' };
  };

  // Get trend
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
        loadingData: '載入中...',
        noData: '無數據',
        clickToAnalyze: '點擊查看完整分析',
        fetchingData: '獲取數據中...',
        remove: '移除',
        error: '載入失敗，請重試',
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
        loadingData: '载入中...',
        noData: '无数据',
        clickToAnalyze: '点击查看完整分析',
        fetchingData: '获取数据中...',
        remove: '移除',
        error: '载入失败，请重试',
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
        loadingData: 'Loading...',
        noData: 'No data',
        clickToAnalyze: 'Click to view full analysis',
        fetchingData: 'Fetching data...',
        remove: 'Remove',
        error: 'Failed to load data',
      };
    }
  };

  const t = getText();

  if (!isOpen) return null;

  const hasStocks = watchlist.length > 0;
  const isLoading = Object.values(loading).some(v => v === true) || isLoadingData;

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {t.title}
            </h3>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>({watchlist.length}/10)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !hasStocks || isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: isRefreshing || !hasStocks || isLoading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing || !hasStocks || isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isRefreshing || !hasStocks || isLoading ? 0.6 : 1
              }}
            >
              <RefreshCw size={14} /> {t.refresh}
            </button>
            <button
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#6B7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
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
        ) : Object.keys(stockData).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
            <p style={{ fontSize: '14px' }}>📊 {t.noData}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {watchlist.map((symbol) => {
              const data = stockData[symbol];
              const isLoadingStock = loading[symbol];
              const rsiStatus = data?.rsi !== undefined && data?.rsi !== null ? getRSIStatus(data.rsi) : getRSIStatus(null);
              const macdStatus = data?.macd ? getMACDStatus(data.macd) : getMACDStatus('Neutral');
              const trendDisplay = data?.trend ? getTrendDisplay(data.trend) : getTrendDisplay('Sideways');

              return (
                <div
                  key={symbol}
                  onClick={() => {
                    console.log('🔍 Selected stock:', symbol);
                    onSelectStock(symbol);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '14px 16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>
                        {symbol}
                      </span>
                      {data?.companyName && data.companyName !== symbol && (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {data.companyName}
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
        {hasStocks && Object.keys(stockData).length > 0 && !isLoading && (
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