// app/components/features/portfolio/PortfolioModule.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { portfolioStore, PortfolioItem, WatchlistItem } from '@/app/lib/portfolio/portfolioStore';

interface Props {
  langKey: string;
  onAnalyzeStock: (symbol: string) => void;
}

export const PortfolioModule: React.FC<Props> = ({ langKey, onAnalyzeStock }) => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist'>('portfolio');
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    symbol: '',
    shares: 1,
    buyPrice: 0,
    notes: '',
  });

  const text = {
    portfolio: langKey === 'Cantonese' ? '我的投資組合' : langKey === '简体中文' ? '我的投资组合' : 'My Portfolio',
    watchlist: langKey === 'Cantonese' ? '觀察列表' : langKey === '简体中文' ? '观察列表' : 'Watchlist',
    addStock: langKey === 'Cantonese' ? '添加股票' : langKey === '简体中文' ? '添加股票' : 'Add Stock',
    symbol: langKey === 'Cantonese' ? '代號' : langKey === '简体中文' ? '代号' : 'Symbol',
    shares: langKey === 'Cantonese' ? '股數' : langKey === '简体中文' ? '股数' : 'Shares',
    buyPrice: langKey === 'Cantonese' ? '買入價' : langKey === '简体中文' ? '买入价' : 'Buy Price',
    currentPrice: langKey === 'Cantonese' ? '現價' : langKey === '简体中文' ? '现价' : 'Current',
    profit: langKey === 'Cantonese' ? '盈虧' : langKey === '简体中文' ? '盈亏' : 'P&L',
    actions: langKey === 'Cantonese' ? '操作' : langKey === '简体中文' ? '操作' : 'Actions',
    remove: langKey === 'Cantonese' ? '移除' : langKey === '简体中文' ? '移除' : 'Remove',
    analyze: langKey === 'Cantonese' ? '分析' : langKey === '简体中文' ? '分析' : 'Analyze',
    totalValue: langKey === 'Cantonese' ? '總市值' : langKey === '简体中文' ? '总市值' : 'Total Value',
    totalProfit: langKey === 'Cantonese' ? '總盈虧' : langKey === '简体中文' ? '总盈亏' : 'Total P&L',
    profitPercent: langKey === 'Cantonese' ? '回報率' : langKey === '简体中文' ? '回报率' : 'Return %',
  };

  const loadData = () => {
    setPortfolio(portfolioStore.getPortfolio());
    setWatchlist(portfolioStore.getWatchlist());
  };

  const fetchCurrentPrices = async () => {
    const allSymbols = [...portfolio.map(p => p.symbol), ...watchlist.map(w => w.symbol)];
    if (allSymbols.length === 0) return;
    
    setLoadingPrices(true);
    const prices: Record<string, number> = {};
    
    for (const symbol of allSymbols) {
      try {
        const response = await fetch(`/api/stock/historical?symbol=${symbol}&range=1d&interval=1d`);
        const data = await response.json();
        if (data.success && data.technicals?.currentPrice) {
          prices[symbol] = data.technicals.currentPrice;
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}`);
      }
    }
    
    setCurrentPrices(prices);
    setLoadingPrices(false);
  };

  useEffect(() => {
    loadData();
    fetchCurrentPrices();
  }, []);

  const handleAddToPortfolio = () => {
    if (!newItem.symbol || newItem.shares <= 0 || newItem.buyPrice <= 0) return;
    
    portfolioStore.addToPortfolio({
      symbol: newItem.symbol.toUpperCase(),
      companyName: newItem.symbol.toUpperCase(),
      shares: newItem.shares,
      buyPrice: newItem.buyPrice,
      buyDate: new Date().toISOString(),
      notes: newItem.notes,
    });
    
    setNewItem({ symbol: '', shares: 1, buyPrice: 0, notes: '' });
    setShowAddModal(false);
    loadData();
    fetchCurrentPrices();
  };

  const handleAddToWatchlist = (symbol: string) => {
    portfolioStore.addToWatchlist({
      symbol: symbol.toUpperCase(),
      companyName: symbol.toUpperCase(),
      addedDate: new Date().toISOString(),
      notes: '',
    });
    loadData();
  };

  const handleRemoveFromPortfolio = (symbol: string) => {
    if (confirm(langKey === 'Cantonese' ? `確定移除 ${symbol}？` : langKey === '简体中文' ? `确定移除 ${symbol}？` : `Remove ${symbol}?`)) {
      portfolioStore.removeFromPortfolio(symbol);
      loadData();
    }
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    portfolioStore.removeFromWatchlist(symbol);
    loadData();
  };

  const totalValue = portfolioStore.getTotalValue(currentPrices);
  const totalProfit = portfolioStore.getTotalProfit(currentPrices);
  const profitPercent = portfolioStore.getProfitPercentage(currentPrices);

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{text.totalValue}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--info-color)' }}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{text.totalProfit}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: totalProfit >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
            {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{text.profitPercent}</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: profitPercent >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('portfolio')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'portfolio' ? '2px solid var(--info-color)' : 'none',
            color: activeTab === 'portfolio' ? 'var(--info-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'portfolio' ? 'bold' : 'normal',
          }}
        >
          {text.portfolio} ({portfolio.length})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'watchlist' ? '2px solid var(--info-color)' : 'none',
            color: activeTab === 'watchlist' ? 'var(--info-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'watchlist' ? 'bold' : 'normal',
          }}
        >
          {text.watchlist} ({watchlist.length})
        </button>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          backgroundColor: 'var(--info-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        + {text.addStock}
      </button>

      {/* Portfolio Table */}
      {activeTab === 'portfolio' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>{text.symbol}</th>
                <th style={{ padding: '8px' }}>{text.shares}</th>
                <th style={{ padding: '8px' }}>{text.buyPrice}</th>
                <th style={{ padding: '8px' }}>{text.currentPrice}</th>
                <th style={{ padding: '8px' }}>{text.profit}</th>
                <th style={{ padding: '8px' }}>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item) => {
                const currentPrice = currentPrices[item.symbol] || item.buyPrice;
                const profit = (currentPrice - item.buyPrice) * item.shares;
                const profitPercent = ((currentPrice - item.buyPrice) / item.buyPrice) * 100;
                return (
                  <tr key={item.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.symbol}</td>
                    <td style={{ padding: '8px' }}>{item.shares}</td>
                    <td style={{ padding: '8px' }}>${item.buyPrice.toFixed(2)}</td>
                    <td style={{ padding: '8px', color: 'var(--info-color)' }}>${currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '8px', color: profit >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                      {profit >= 0 ? '+' : ''}${profit.toFixed(2)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => onAnalyzeStock(item.symbol)}
                        style={{ backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', marginRight: '8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {text.analyze}
                      </button>
                      <button
                        onClick={() => handleRemoveFromPortfolio(item.symbol)}
                        style={{ backgroundColor: 'var(--error-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {text.remove}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {portfolio.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    {langKey === 'Cantonese' ? '暫無股票，點擊「添加股票」開始' : langKey === '简体中文' ? '暂无股票，点击「添加股票」开始' : 'No stocks yet. Click "Add Stock" to start'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Watchlist Table */}
      {activeTab === 'watchlist' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>{text.symbol}</th>
                <th style={{ padding: '8px' }}>{text.currentPrice}</th>
                <th style={{ padding: '8px' }}>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => {
                const currentPrice = currentPrices[item.symbol];
                return (
                  <tr key={item.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.symbol}</td>
                    <td style={{ padding: '8px', color: 'var(--info-color)' }}>{currentPrice ? `$${currentPrice.toFixed(2)}` : 'N/A'}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => onAnalyzeStock(item.symbol)}
                        style={{ backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', marginRight: '8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {text.analyze}
                      </button>
                      <button
                        onClick={() => handleRemoveFromWatchlist(item.symbol)}
                        style={{ backgroundColor: 'var(--error-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {text.remove}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    {langKey === 'Cantonese' ? '觀察列表為空' : langKey === '简体中文' ? '观察列表为空' : 'Watchlist is empty'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', width: '300px' }}>
            <h3 style={{ marginBottom: '16px' }}>{text.addStock}</h3>
            <input
              type="text"
              placeholder={text.symbol}
              value={newItem.symbol}
              onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <input
              type="number"
              placeholder={text.shares}
              value={newItem.shares}
              onChange={(e) => setNewItem({ ...newItem, shares: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <input
              type="number"
              step="0.01"
              placeholder={text.buyPrice}
              value={newItem.buyPrice}
              onChange={(e) => setNewItem({ ...newItem, buyPrice: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAddToPortfolio} style={{ flex: 1, backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}>Add</button>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};