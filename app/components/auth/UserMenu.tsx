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
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  profile, 
  onLogout, 
  onOpenPricingPage,
  onSelectPlan,
  onClose 
}) => {
  const [mounted, setMounted] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);

  // Move these INSIDE the component
  // In UserMenu.tsx, inside the component
const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'User';
const credits = profile?.credits ?? 0;
const plan = profile?.subscription_plan || profile?.subscription_status || 'Free Explorer';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleChangePlan = () => {
    console.log("🟢 Change Plan clicked");
    handleClose();
    onOpenPricingPage();
  };

  const handleUnsubscribe = () => {
    console.log("🔴 Unsubscribe button clicked");
    setShowUnsubscribe(true);
    console.log("🟢 setShowUnsubscribe(true) called, new value: true");
  };

  const handleLogout = () => {
    console.log("🔴 Logout button clicked");
    handleClose();
    onLogout();
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
        onClose={() => {
          console.log("🟢 Closing modal, setting showUnsubscribe to false");
          setShowUnsubscribe(false);
        }}
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