// components/auth/UnsubscribeModal.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DowngradePlanModal } from './DowngradePlanModal';

interface UnsubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSelectPlan: (planId: string, priceId: string) => void;
}

const cancelReasons = [
  "Too expensive for my usage",
  "Missing features I need",
  "Don't use it enough",
  "Technical issues or bugs",
  "Found a better alternative",
  "Temporary pause (will return)",
  "Other"
];

const UnsubscribeModal: React.FC<UnsubscribeModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSelectPlan,
}) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'reconsider' | 'reason' | 'confirm'>('reconsider');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!isOpen) return null;

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReconsiderConfirm = () => {
    console.log("🟢 No, cancel anyway clicked");
    setStep('reason');
  };

  const handleDowngradeInstead = () => {
    console.log("🟢 Downgrade Instead clicked - opening downgrade modal");
    // Close the unsubscribe modal
    onClose();
    // Open the downgrade modal directly
    setShowDowngradeModal(true);
  };

  const handleReturn = () => {
    console.log("🟢 Return to Dashboard clicked");
    onClose();
  };

  const handleCloseDowngradeModal = () => {
    console.log("🟢 Closing downgrade modal");
    setShowDowngradeModal(false);
  };

  const handleSubmitReason = async () => {
    if (selectedReasons.length === 0) return;
    
    setLoading(true);
    
    const reasonsText = selectedReasons.join(', ');
    const finalReason = selectedReasons.includes('Other') && customReason 
      ? `${reasonsText} - Custom: ${customReason}`
      : reasonsText;
    
    try {
      if (supabase && supabase.from && user?.id) {
        await supabase
          .from('cancellation_feedback')
          .insert({
            user_id: user?.id,
            email: user?.email,
            plan: profile?.subscription_plan,
            reason: finalReason,
            cancelled_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
    
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user?.email,
          returnUrl: window.location.origin,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error || "Unable to open subscription portal. Please contact support.");
        setLoading(false);
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
      alert("Connection failed. Please try again.");
      setLoading(false);
    }
  };

  if (showThankYou) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg style={{ width: '32px', height: '32px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>Thank You for Visiting vibeAiLink</h2>
          <p style={{ marginBottom: '16px' }}>Your credit balance will be honored until the end of your current billing period.</p>
          <button
            onClick={() => { onClose(); window.location.href = '/'; }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              color: '#9CA3AF',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ✕
          </button>
          
          <div style={{ padding: '24px' }}>
            {step === 'reconsider' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>We're sad to see you go! 😢</h2>
                <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '24px' }}>
                  Before you cancel, would you consider downgrading to a more affordable plan?
                </p>
                
                <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <p style={{ fontWeight: '600', color: '#b45309', textAlign: 'center' }}>☕ Monthly Coffee Plan</p>
                  <p style={{ fontSize: '14px', color: '#b45309', textAlign: 'center', marginTop: '4px' }}>
                    Only $10/month for 300 credits
                  </p>
                  <p style={{ fontSize: '12px', color: '#b45309', textAlign: 'center', marginTop: '4px' }}>
                    Perfect for casual users
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleReconsiderConfirm}
                    style={{ flex: 1, padding: '10px', border: '1px solid #fca5a5', borderRadius: '8px', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer' }}
                  >
                    No, cancel anyway
                  </button>
                  <button
                    onClick={handleDowngradeInstead}
                    style={{ flex: 1, padding: '10px', backgroundColor: '#16a34a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Downgrade Instead
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button
                    onClick={handleReturn}
                    style={{ color: '#9CA3AF', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
            
            {step === 'reason' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>Help us improve</h2>
                <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}>
                  Please tell us why you're cancelling
                </p>
                
                <div style={{ marginBottom: '16px', maxHeight: '256px', overflowY: 'auto' }}>
                  {cancelReasons.map((reason) => (
                    <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason)}
                        onChange={() => handleReasonToggle(reason)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px' }}>{reason}</span>
                    </label>
                  ))}
                </div>
                
                {selectedReasons.includes('Other') && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please tell us more..."
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}
                    rows={3}
                  />
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setStep('reconsider')}
                    style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white', color: '#4b5563', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitReason}
                    disabled={selectedReasons.length === 0 || loading}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: selectedReasons.length > 0 && !loading ? 'pointer' : 'not-allowed',
                      backgroundColor: selectedReasons.length > 0 && !loading ? '#dc2626' : '#d1d5db',
                      color: 'white',
                    }}
                  >
                    {loading ? 'Redirecting...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Downgrade Plan Modal - Always rendered, controlled by isOpen */}
      <DowngradePlanModal
        isOpen={showDowngradeModal}
        onClose={handleCloseDowngradeModal}
        user={user}
        profile={profile}
        onSelectPlan={onSelectPlan}
      />
    </>
  );
};

export default UnsubscribeModal;