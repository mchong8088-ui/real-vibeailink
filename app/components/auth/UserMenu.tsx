// components/auth/UserMenu.tsx
import React, { useState } from 'react';
import UnsubscribeModal from './UnsubscribeModal';
import { DowngradePlanModal } from './DowngradePlanModal';

interface UserMenuProps {
  user: any;
  profile: any;
  onLogout: () => void;
  onOpenPricingPage: () => void;  // Changed from onOpenCoffeePlan
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
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Dashboard Popup - Compact, right-aligned */}
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
      }}>
        {/* Close button */}
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

        {/* Welcome Header - Compact */}
        <div style={{ marginBottom: '14px', marginTop: '4px', paddingRight: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563EB', margin: 0 }}>
            Welcome Back,
          </h2>
          <p style={{ fontSize: '14px', color: '#F59E0B', fontWeight: '500', marginTop: '2px' }}>
            {profile?.display_name || user?.email?.split('@')[0]}
          </p>
        </div>

        {/* Dashboard Items - Credits and Current Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Credits Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #F3F4F6',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB' }}>Credits</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>{profile?.credits || 0}</span>
          </div>

          {/* Current Plan Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #F3F4F6',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB' }}>Plan</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#F59E0B' }}>{profile?.subscription_plan || 'Free Explorer'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {/* Change Plan - Opens pricing page for upgrade/downgrade */}
          <button
            onClick={() => {
              handleClose();
              onOpenPricingPage();  // Opens pricing modal
            }}
            style={{
              width: '100%',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Change Plan
          </button>
          
          {/* Unsubscribe - Opens unsubscribe modal with Coffee Plan as retention offer */}
          <button
            onClick={() => {
              handleClose();
              setShowUnsubscribe(true);
            }}
            style={{
              width: '100%',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Unsubscribe
          </button>
          
          {/* Logout */}
          <button
            onClick={() => {
              handleClose();
              onLogout();
            }}
            style={{
              width: '100%',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontWeight: '500',
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Unsubscribe Modal - Contains Coffee Plan retention offer */}
      <UnsubscribeModal
        isOpen={showUnsubscribe}
        onClose={() => setShowUnsubscribe(false)}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
      
      {/* Downgrade Plan Modal - For plan changes */}
      <DowngradePlanModal
        isOpen={showDowngrade}
        onClose={() => setShowDownglide(false)}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
    </>
  );
};

export default UserMenu;