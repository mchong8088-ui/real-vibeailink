"use client";
import React, { useState, useEffect } from 'react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
  langKey: string;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  langKey,
}) => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('stockWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    localStorage.setItem('stockWatchlist', JSON.stringify(newList));
  };

  const addStock = () => {
    const symbol = newStock.trim().toUpperCase();
    if (!symbol) return;
    if (watchlist.includes(symbol)) {
      alert(langKey === 'Traditional Chinese' ? '股票已在追蹤清單中' :
            langKey === 'Simplified Chinese' ? '股票已在追踪清单中' :
            'Stock already in watchlist');
      return;
    }
    if (watchlist.length >= 10) {
      alert(langKey === 'Traditional Chinese' ? '追蹤清單最多10隻股票' :
            langKey === 'Simplified Chinese' ? '追踪清单最多10只股票' :
            'Watchlist limit is 10 stocks');
      return;
    }
    saveWatchlist([...watchlist, symbol]);
    setNewStock('');
  };

  const removeStock = (symbol: string) => {
    saveWatchlist(watchlist.filter(s => s !== symbol));
  };

  const getText = () => {
    if (langKey === 'Traditional Chinese') {
      return {
        title: '我的追蹤清單',
        limit: '最多10隻股票',
        addPlaceholder: '輸入股票代號 (如: TSLA, 0700.HK)',
        add: '新增',
        empty: '暫無追蹤股票',
        addHint: '點擊上方 + 按鈕新增股票',
        max: '已達上限'
      };
    } else if (langKey === 'Simplified Chinese') {
      return {
        title: '我的追踪清单',
        limit: '最多10只股票',
        addPlaceholder: '输入股票代码 (如: TSLA, 0700.HK)',
        add: '新增',
        empty: '暂无追踪股票',
        addHint: '点击上方 + 按钮新增股票',
        max: '已达上限'
      };
    } else {
      return {
        title: 'My Watchlist',
        limit: 'Max 10 stocks',
        addPlaceholder: 'Enter stock symbol (e.g., TSLA, 0700.HK)',
        add: 'Add',
        empty: 'No stocks in watchlist',
        addHint: 'Click + above to add stocks',
        max: 'Limit reached'
      };
    }
  };

  const t = getText();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{t.title}</h3>
            <p style={{ fontSize: '10px', color: '#6B7280', margin: '4px 0 0' }}>{t.limit}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder={t.addPlaceholder}
            onKeyPress={(e) => e.key === 'Enter' && addStock()}
            disabled={watchlist.length >= 10}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            onClick={addStock}
            disabled={watchlist.length >= 10}
            style={{
              padding: '10px 16px',
              backgroundColor: watchlist.length >= 10 ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: watchlist.length >= 10 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {t.add}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {watchlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              <p>📭</p>
              <p style={{ fontSize: '13px' }}>{t.empty}</p>
              <p style={{ fontSize: '11px', marginTop: '8px' }}>{t.addHint}</p>
            </div>
          ) : (
            watchlist.map((symbol) => (
              <div
                key={symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <button
                  onClick={() => {
                    onSelectStock(symbol);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1F2937'
                  }}
                >
                  {symbol}
                </button>
                <button
                  onClick={() => removeStock(symbol)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {watchlist.length === 10 && (
          <div style={{ padding: '12px', backgroundColor: '#FEF3C7', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#92400E' }}>⚠️ {t.max}</span>
          </div>
        )}
      </div>
    </div>
  );
};