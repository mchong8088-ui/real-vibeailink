// components/auth/UserMenu.tsx
"use client";
import React, { useState, useEffect } from 'react';
import UnsubscribeModal from './UnsubscribeModal';
import { DowngradePlanModal } from './DowngradePlanModal';

interface UserMenuProps {
  user: any;
  profile: any;
  onLogout: () => void;
  onOpenPricingPage: () => void;
  onSelectPlan: (planId: string, priceId: string) => void;
  onClose?: () => void;
  onAnalyzeStock?: (symbol: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  profile, 
  onLogout, 
  onOpenPricingPage,
  onSelectPlan,
  onClose,
  onAnalyzeStock,
}) => {
  const [mounted, setMounted] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'User';
  const credits = profile?.credits ?? 0;
  const plan = profile?.subscription_plan || profile?.subscription_status || 'Free Explorer';

  // Load watchlist from localStorage - runs when component mounts
  const loadWatchlist = () => {
    console.log("📊 Loading watchlist from localStorage");
    const saved = localStorage.getItem('stockWatchlist');
    console.log("📊 Raw saved data:", saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("📊 Parsed watchlist:", parsed);
        setWatchlist(parsed);
      } catch (error) {
        console.error("📊 Error parsing watchlist:", error);
        setWatchlist([]);
      }
    } else {
      console.log("📊 No watchlist found in localStorage");
      setWatchlist([]);
    }
  };

  useEffect(() => {
    loadWatchlist();
    setMounted(true);
  }, []);

  // Also reload watchlist when the component becomes visible (when user opens menu)
  useEffect(() => {
    if (mounted) {
      loadWatchlist();
    }
  }, [mounted]);

  if (!mounted) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleChangePlan = () => {
    handleClose();
    onOpenPricingPage();
  };

  const handleUnsubscribe = () => {
    setShowUnsubscribe(true);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const toggleWatchlist = () => {
    console.log("⭐ Toggling watchlist, current state:", showWatchlist);
    // Reload watchlist before showing
    loadWatchlist();
    setShowWatchlist(!showWatchlist);
  };

  const handleWatchlistStockClick = (symbol: string) => {
    console.log("📊 Clicked watchlist stock:", symbol);
    setShowWatchlist(false);
    handleClose();
    if (onAnalyzeStock) {
      onAnalyzeStock(symbol);
    }
  };

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        width: '300px',
        padding: '16px',
        position: 'relative',
        marginLeft: 'auto',
        marginRight: '0',
        marginBottom: '20px',
        border: '1px solid #E5E7EB',
        zIndex: 50,
      }}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            color: '#9CA3AF',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '14px', marginTop: '4px', paddingRight: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563EB', margin: 0 }}>
            Welcome Back,
          </h2>
          <p style={{ fontSize: '14px', color: '#F59E0B', fontWeight: '500', marginTop: '2px' }}>
            {displayName}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB' }}>Credits</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>{credits}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB' }}>Plan</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#F59E0B' }}>{plan}</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {/* Watchlist Button with dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleWatchlist}
              style={{ 
                width: '100%', 
                backgroundColor: '#FEF3C7', 
                color: '#D97706', 
                fontWeight: '500', 
                padding: '8px', 
                borderRadius: '12px', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px' 
              }}
            >
              <span>⭐</span> My Watchlist
              <span style={{ fontSize: '10px', color: '#92400E' }}>({watchlist.length})</span>
            </button>
            
            {/* Watchlist dropdown */}
            {showWatchlist && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 60,
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '8px'
              }}>
                {watchlist.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                    No stocks in watchlist
                  </div>
                ) : (
                  watchlist.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleWatchlistStockClick(symbol)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#1F2937',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <span>📊</span> {symbol}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleChangePlan}
            style={{ width: '100%', backgroundColor: '#EFF6FF', color: '#2563EB', fontWeight: '500', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Change Plan
          </button>
          
          <button
            onClick={handleUnsubscribe}
            style={{ width: '100%', backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: '500', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Unsubscribe
          </button>
          
          <button
            onClick={handleLogout}
            style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#374151', fontWeight: '500', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>

      <UnsubscribeModal
        isOpen={showUnsubscribe}
        onClose={() => setShowUnsubscribe(false)}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
      
      <DowngradePlanModal
        isOpen={showDowngrade}
        onClose={() => setShowDowngrade(false)}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
    </>
  );
};

export default UserMenu;