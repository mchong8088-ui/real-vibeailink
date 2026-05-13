// components/auth/DowngradePlanModal.tsx
"use client";
import React, { useState } from 'react';
import { STRIPE_PRICE_IDS } from '@/constants/stripePrices';

interface DowngradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSelectPlan: (planId: string, priceId: string) => void;
}

export const DowngradePlanModal: React.FC<DowngradePlanModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePlanAction = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);
    
    let priceId = '';
    if (planId === 'coffee') {
      priceId = STRIPE_PRICE_IDS.COFFEE_MONTHLY;
    } else if (planId === 'prolite') {
      priceId = billingCycle === 'monthly' 
        ? STRIPE_PRICE_IDS.PRO_LITE_MONTHLY 
        : STRIPE_PRICE_IDS.PRO_LITE_ANNUAL;
    }
    
    onSelectPlan(planId, priceId);
    setLoading(false);
  };

  const plans = [
    {
      id: 'coffee',
      name: 'COFFEE',
      price: { monthly: 10, annual: 10 },
      credits: '300',
      period: '/mo',
      features: [
        'Real time Stock data',
        'Global News updates',
        'Multi-language voice',
        'URL input',
        'AI summary'
      ],
      buttonText: 'Switch'
    },
    {
      id: 'prolite',
      name: 'PRO ELITE',
      price: { monthly: 29, annual: 23 },
      credits: '1,500',
      period: '/mo',
      features: [
        'Everything in Coffee',
        'Priority support',
        'Advanced analytics',
        'API access'
      ],
      buttonText: 'Switch'
    }
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '8vh',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '650px',
        padding: '12px',
        position: 'relative',
        marginTop: '10px',
        marginLeft: '16px',
        marginRight: '16px',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#9CA3AF',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px', marginTop: '8px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Want to change to a lower cost plan to save cost?</h2>
          <p style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>Choose a plan that better fits your needs</p>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <div style={{ backgroundColor: '#F3F4F6', borderRadius: '9999px', padding: '2px', display: 'inline-flex' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '3px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
                color: billingCycle === 'monthly' ? '#111827' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '3px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: billingCycle === 'annual' ? 'white' : 'transparent',
                color: billingCycle === 'annual' ? '#111827' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Annual <span style={{ color: '#22C55E' }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* 2 Plans Row - Compact */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header - BLUE */}
              <div style={{ backgroundColor: '#3B82F6', padding: '6px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', margin: 0 }}>{plan.name}</h3>
              </div>

              {/* Price - White */}
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>${currentPrice(plan)}</span>
                <span style={{ color: '#6B7280', fontSize: '10px' }}>{plan.period}</span>
                <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{plan.credits} credits</p>
              </div>

              {/* Features - Compact */}
              <div style={{ padding: '6px', flex: 1 }}>
                {plan.features.map((feature, idx) => (
                  <p key={idx} style={{ fontSize: '9px', color: '#4B5563', marginBottom: '2px', lineHeight: '1.2' }}>• {feature}</p>
                ))}
              </div>

              {/* Button - GREEN */}
              <div style={{ padding: '6px', backgroundColor: '#F9FAFB' }}>
                <button
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                  style={{
                    width: '100%',
                    backgroundColor: '#22C55E',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '5px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: loading && selectedPlan === plan.id ? 'not-allowed' : 'pointer',
                    fontSize: '10px',
                  }}
                >
                  {loading && selectedPlan === plan.id ? '...' : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cancel Link */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};