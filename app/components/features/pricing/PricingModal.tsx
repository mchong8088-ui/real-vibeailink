// components/features/pricing/PricingModal.tsx
"use client";
import React, { useState } from 'react';
import { STRIPE_PRICE_IDS } from '../../../constants/stripePrices';

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
      <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#3B82F6', padding: '12px 16px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>☕ Coffee Plan</h3>
          </div>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>$10</span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>/month</span>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>300 credits per month</p>
          </div>
          <div style={{ padding: '16px' }}>
            <button
              onClick={handleCoffeeClick}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#22C55E',
                color: 'white',
                fontWeight: 'bold',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {loading ? 'Processing...' : 'Join the Plan'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
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
        onSelectPlan('topup', STRIPE_PRICE_IDS.COFFEE_TOPUP);
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
      shortName: 'EXP',
      price: { monthly: 0, annual: 0 },
      credits: '100',
      period: 'one-time',
      features: [
        'Real time Stock data',
        'Key Global News updates',
        'Multi-language voice',
        'Basic AI summary'
      ],
      buttonText: isExistingUser ? 'Top-up' : 'Join'
    },
    {
      id: 'prolite',
      name: 'PRO LITE',
      shortName: 'PRO',
      price: { monthly: 29, annual: 23 },
      credits: '1,500',
      period: '/mo',
      features: [
        'Everything in Explorer',
        'Personal URL input',
        'Real time AI summary',
        'Priority email support'
      ],
      buttonText: 'Join'
    },
    {
      id: 'institutional',
      name: 'INSTITUTIONAL',
      shortName: 'INST',
      price: { monthly: 99, annual: 79 },
      credits: '8,000',
      period: '/mo',
      features: [
        'Everything in Pro Lite',
        'API access',
        'Dedicated account manager',
        'Priority processing'
      ],
      buttonText: 'Join'
    }
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (billingCycle === 'annual' && plan.price.annual < plan.price.monthly) {
      const monthlyTotal = plan.price.monthly * 12;
      return monthlyTotal - plan.price.annual;
    }
    return 0;
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', overflowX: 'auto' }}>
      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#F3F4F6', borderRadius: '9999px', padding: '4px', display: 'inline-flex' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '6px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
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
              padding: '6px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: billingCycle === 'annual' ? 'white' : 'transparent',
              color: billingCycle === 'annual' ? '#111827' : '#6B7280',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Annual <span style={{ color: '#22C55E', fontSize: '10px' }}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* 3 Plans Row - Compact for mobile */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              flex: '1 1 0',
              minWidth: '100px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px -1px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header - BLUE */}
            <div style={{ backgroundColor: '#3B82F6', padding: '8px', textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: 'white', 
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {plan.name}
              </h3>
            </div>

            {/* Price - White */}
            <div style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
              {currentPrice(plan) === 0 ? (
                <>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>FREE</span>
                  <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>{plan.credits} credits</p>
                  <p style={{ fontSize: '9px', color: '#9CA3AF' }}>{plan.period}</p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>${currentPrice(plan)}</span>
                  <span style={{ color: '#6B7280', fontSize: '11px' }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>{plan.credits} credits</p>
                  <p style={{ fontSize: '9px', color: '#9CA3AF' }}>{plan.period}</p>
                  {getSavings(plan) > 0 && (
                    <p style={{ fontSize: '9px', color: '#22C55E', marginTop: '4px' }}>Save ${getSavings(plan)}/yr</p>
                  )}
                </>
              )}
              {plan.id === 'explorer' && isExistingUser && (
                <p style={{ fontSize: '9px', color: '#F97316', marginTop: '6px', fontWeight: '500' }}>Top-up $5/100cr</p>
              )}
            </div>

            {/* Features - Compact */}
            <div style={{ padding: '8px', flex: 1 }}>
              {plan.features.map((feature, idx) => (
                <p key={idx} style={{ fontSize: '8px', color: '#4B5563', marginBottom: '4px', lineHeight: '1.3' }}>• {feature}</p>
              ))}
            </div>

            {/* Button - GREEN */}
            <div style={{ padding: '10px', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={() => handlePlanAction(plan.id, plan.id === 'explorer' && isExistingUser)}
                disabled={loading && selectedPlan === plan.id}
                style={{
                  width: '100%',
                  backgroundColor: '#22C55E',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading && selectedPlan === plan.id ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                }}
              >
                {loading && selectedPlan === plan.id ? '...' : plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Close Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};