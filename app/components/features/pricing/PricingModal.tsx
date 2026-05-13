// components/features/pricing/PricingModal.tsx
"use client";
import React, { useState } from 'react';
import { STRIPE_PRICE_IDS } from '@/constants/stripePrices';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSelectPlan: (planId: string, priceId: string) => void;
  showRetentionOnly?: boolean;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSelectPlan,
  showRetentionOnly = false,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isExistingUser = !!user;

  // Retention Mode - Coffee Plan only
  if (showRetentionOnly) {
    const handleCoffeeClick = async () => {
      setLoading(true);
      onSelectPlan('coffee', STRIPE_PRICE_IDS.COFFEE_MONTHLY);
      setLoading(false);
    };

    return (
      <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#3B82F6', padding: '16px 20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>☕ Coffee Plan</h3>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>$10</span>
            <span style={{ color: '#6B7280', fontSize: '18px' }}>/month</span>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>300 credits per month</p>
          </div>
          <div style={{ padding: '20px' }}>
            <button
              onClick={handleCoffeeClick}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#22C55E',
                color: 'white',
                fontWeight: 'bold',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {loading ? 'Processing...' : 'Join the Plan'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  const handlePlanAction = async (planId: string, isTopUp?: boolean) => {
    setSelectedPlan(planId);
    setLoading(true);
    
    if (planId === 'explorer') {
      if (!user) {
        onClose();
        setLoading(false);
        return;
      } else if (isTopUp) {
        onSelectPlan('topup', STRIPE_PRICE_IDS.TOPUP_100_CREDITS);
      }
    } else if (planId === 'prolite') {
      const priceId = billingCycle === 'monthly' 
        ? STRIPE_PRICE_IDS.PRO_LITE_MONTHLY 
        : STRIPE_PRICE_IDS.PRO_LITE_ANNUAL;
      onSelectPlan(planId, priceId);
    } else if (planId === 'institutional') {
      const priceId = billingCycle === 'monthly'
        ? STRIPE_PRICE_IDS.INSTITUTIONAL_MONTHLY
        : STRIPE_PRICE_IDS.INSTITUTIONAL_ANNUAL;
      onSelectPlan(planId, priceId);
    }
    
    setLoading(false);
  };

  const plans = [
    {
      id: 'explorer',
      name: 'EXPLORER',
      price: { monthly: 0, annual: 0 },
      credits: '100 credits',
      period: 'one-time',
      features: [
        'Real time Stock data - HK/TW/US markets',
        'Key Global News updates',
        'Cantonese, Mandarin & English voice support',
        'Basic AI summary & Analysis'
      ],
      buttonText: isExistingUser ? 'Top-up Coffee Plan' : 'Join the Plan'
    },
    {
      id: 'prolite',
      name: 'PRO LITE',
      price: { monthly: 29, annual: 23 },
      credits: '1,500 credits',
      period: '/month',
      features: [
        'Everything in Explorer',
        'Personal URL input for analysis',
        'Real time AI summary without bias',
        'Priority email support'
      ],
      buttonText: 'Join the Plan'
    },
    {
      id: 'institutional',
      name: 'INSTITUTIONAL',
      price: { monthly: 99, annual: 79 },
      credits: '8,000 credits',
      period: '/month',
      features: [
        'Everything in Pro Lite',
        'API access',
        'Dedicated account manager',
        'Priority processing'
      ],
      buttonText: 'Join the Plan'
    }
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (billingCycle === 'annual' && plan.price.annual < plan.price.monthly) {
      return (plan.price.monthly * 12 - plan.price.annual);
    }
    return 0;
  };

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#F3F4F6', borderRadius: '9999px', padding: '4px', display: 'inline-flex' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 28px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
              color: billingCycle === 'monthly' ? '#111827' : '#6B7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '8px 28px',
              borderRadius: '9999px',
              fontSize: '14px',
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

      {/* 3 Plans Row */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header - BLUE */}
            <div style={{ backgroundColor: '#3B82F6', padding: '16px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>{plan.name}</h3>
            </div>

            {/* Price - White */}
            <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
              {currentPrice(plan) === 0 ? (
                <>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>FREE</span>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>{plan.credits}</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{plan.period}</p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>${currentPrice(plan)}</span>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>{plan.credits}</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{plan.period}</p>
                  {getSavings(plan) > 0 && (
                    <p style={{ fontSize: '12px', color: '#22C55E', marginTop: '6px' }}>Save ${getSavings(plan)}/year</p>
                  )}
                </>
              )}
              {plan.id === 'explorer' && isExistingUser && (
                <p style={{ fontSize: '13px', color: '#F97316', marginTop: '10px', fontWeight: '500' }}>Top-up $5 for 100 credits</p>
              )}
            </div>

            {/* Features */}
            <div style={{ padding: '16px', flex: 1 }}>
              {plan.features.map((feature, idx) => (
                <p key={idx} style={{ fontSize: '13px', color: '#4B5563', marginBottom: '8px', lineHeight: '1.4' }}>• {feature}</p>
              ))}
            </div>

            {/* Button - GREEN */}
            <div style={{ padding: '16px', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={() => handlePlanAction(plan.id, plan.id === 'explorer' && isExistingUser)}
                disabled={loading && selectedPlan === plan.id}
                style={{
                  width: '100%',
                  backgroundColor: '#22C55E',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading && selectedPlan === plan.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {loading && selectedPlan === plan.id ? '...' : plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Close Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};