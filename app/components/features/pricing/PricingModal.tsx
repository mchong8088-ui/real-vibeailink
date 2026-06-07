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

  // Summer promotion dates
  const promotionEndDate = "August 31, 2026";
  
  // Check if promotion is still active
  const isPromotionActive = (): boolean => {
    const today = new Date();
    const endDate = new Date(2026, 7, 31); // August 31, 2026 (month is 0-indexed)
    return today <= endDate;
  };
  
  const promotionActive = isPromotionActive();
  
  // Promotion prices (50% off)
  const promotionPrices = {
    monthly: {
      proLite: 14.5,
      institutional: 49.5
    },
    annual: {
      proLite: 11.5,
      institutional: 39.5
    }
  };
  
  // Original prices for strikethrough (monthly rates)
  const originalPrices = {
    monthly: {
      proLite: 29,
      institutional: 99
    },
    annual: {
      proLite: 23,
      institutional: 79
    }
  };

  const isExistingUser = !!user;

  // Retention Mode - Coffee Plan only
  if (showRetentionOnly) {
    const handleCoffeeClick = async () => {
      setLoading(true);
      onSelectPlan('coffee', STRIPE_PRICE_IDS.COFFEE_MONTHLY);
      setLoading(false);
    };

    return (
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '24px', 
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>☕</div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Coffee Plan</h3>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>$10</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px' }}>/month</span>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>300 credits per month</p>
          </div>
          <button
            onClick={handleCoffeeClick}
            disabled={loading}
            style={{
              width: '100%',
              background: 'white',
              color: '#667eea',
              fontWeight: 'bold',
              padding: '14px',
              borderRadius: '40px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Processing...' : 'Join the Plan →'}
          </button>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '16px' }}>Close</button>
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
      // Use promotional price if active, otherwise regular price
      let priceId;
      if (billingCycle === 'monthly') {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_PRO_LITE_MONTHLY : STRIPE_PRICE_IDS.PRO_LITE_MONTHLY;
      } else {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_PRO_LITE_ANNUAL : STRIPE_PRICE_IDS.PRO_LITE_ANNUAL;
      }
      onSelectPlan(planId, priceId);
    } else if (planId === 'institutional') {
      // Use promotional price if active, otherwise regular price
      let priceId;
      if (billingCycle === 'monthly') {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_INSTITUTIONAL_MONTHLY : STRIPE_PRICE_IDS.INSTITUTIONAL_MONTHLY;
      } else {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_INSTITUTIONAL_ANNUAL : STRIPE_PRICE_IDS.INSTITUTIONAL_ANNUAL;
      }
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
      promotionPrice: { monthly: 0, annual: 0 },
      originalPrice: { monthly: 0, annual: 0 },
      displayPrice: { monthly: 0, annual: 0 },
      displayOriginal: { monthly: 0, annual: 0 },
      credits: '100',
      period: 'one-time',
      features: [
        'Real time Stock data',
        'Key Global News updates',
        'Multi-language voice',
        'Basic AI summary'
      ],
      buttonText: isExistingUser ? 'Top-up' : 'Join',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'prolite',
      name: 'PRO LITE',
      shortName: 'PRO',
      displayPrice: { monthly: promotionPrices.monthly.proLite, annual: promotionPrices.annual.proLite },
      displayOriginal: { monthly: originalPrices.monthly.proLite, annual: originalPrices.annual.proLite },
      credits: '1,500',
      period: '/mo',
      features: [
        'Everything in Explorer',
        'Personal URL input',
        'Real time AI summary',
        'Priority email support'
      ],
      buttonText: 'Join',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      popular: true
    },
    {
      id: 'institutional',
      name: 'INSTITUTIONAL',
      shortName: 'INST',
      displayPrice: { monthly: promotionPrices.monthly.institutional, annual: promotionPrices.annual.institutional },
      displayOriginal: { monthly: originalPrices.monthly.institutional, annual: originalPrices.annual.institutional },
      credits: '8,000',
      period: '/mo',
      features: [
        'Everything in Pro Lite',
        'API access',
        'Dedicated account manager',
        'Priority processing'
      ],
      buttonText: 'Join',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.displayPrice.monthly : plan.displayPrice.annual;
  };

  const currentOriginalPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.displayOriginal.monthly : plan.displayOriginal.annual;
  };

  const getAnnualTotal = (plan: typeof plans[0]) => {
    return (billingCycle === 'annual' ? currentPrice(plan) * 12 : currentPrice(plan)).toFixed(0);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header with Promotion Banner - Only show if promotion is active */}
      {promotionActive && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '28px' }}>🎉</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>🔥 SUMMER PROMOTION 🔥</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>50% OFF on Pro Lite & Institutional Plans!</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>⏰ Offer expires on {promotionEndDate}</div>
            </div>
            <span style={{ fontSize: '28px' }}>☀️</span>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ 
          backgroundColor: '#F3F4F6', 
          borderRadius: '9999px', 
          padding: '4px', 
          display: 'inline-flex',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '10px 32px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
              color: billingCycle === 'monthly' ? '#111827' : '#6B7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            📆 Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '10px 32px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: billingCycle === 'annual' ? 'white' : 'transparent',
              color: billingCycle === 'annual' ? '#111827' : '#6B7280',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📅 Annual <span style={{ color: '#22C55E', fontSize: '11px', marginLeft: '4px' }}>Save 20%</span>
          </button>
        </div>
      </div>

      {/* 3 Plans Row */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              flex: '1 1 0',
              minWidth: '280px',
              maxWidth: '320px',
              background: 'white',
              borderRadius: '24px',
              overflow: 'hidden',
              border: plan.popular ? '2px solid #f5576c' : '1px solid #E5E7EB',
              boxShadow: plan.popular ? '0 20px 35px -10px rgba(245,87,108,0.3)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 30px 40px -15px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = plan.popular ? '0 20px 35px -10px rgba(245,87,108,0.3)' : '0 10px 25px -5px rgba(0,0,0,0.1)';
            }}
          >
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '-30px',
                background: '#f5576c',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 30px',
                transform: 'rotate(45deg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                POPULAR
              </div>
            )}

            {/* Header */}
            <div style={{ 
              background: plan.gradient, 
              padding: '24px 20px', 
              textAlign: 'center',
              color: 'white'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{plan.name}</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{plan.credits} credits</p>
            </div>

            {/* Price */}
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
              {currentPrice(plan) === 0 ? (
                <>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>FREE</span>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{plan.period}</p>
                </>
              ) : (
                <>
                  {/* Original price with strikethrough - only if promotion is active */}
                  {promotionActive && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ 
                        fontSize: '18px', 
                        color: '#9CA3AF', 
                        textDecoration: 'line-through',
                        marginRight: '8px'
                      }}>
                        ${currentOriginalPrice(plan)}
                      </span>
                      <span style={{ 
                        backgroundColor: '#EF4444', 
                        color: 'white', 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        50% OFF
                      </span>
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: promotionActive ? '#EF4444' : '#111827' }}>${currentPrice(plan)}</span>
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>/{billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '8px', fontWeight: '500' }}>
                    {billingCycle === 'annual' 
                      ? `$${getAnnualTotal(plan)} billed annually` 
                      : 'billed monthly'}
                  </p>
                </>
              )}
            </div>

            {/* Features */}
            <div style={{ padding: '20px', flex: 1, minHeight: '180px' }}>
              {plan.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#22C55E', fontSize: '14px' }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#4B5563' }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <div style={{ padding: '20px', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={() => handlePlanAction(plan.id, plan.id === 'explorer' && isExistingUser)}
                disabled={loading && selectedPlan === plan.id}
                style={{
                  width: '100%',
                  background: plan.gradient,
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: loading && selectedPlan === plan.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!(loading && selectedPlan === plan.id)) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading && selectedPlan === plan.id ? 'Processing...' : `${plan.buttonText} →`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Promotion Footer - Only show if promotion is active */}
      {promotionActive && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px',
          padding: '16px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '16px',
          border: '1px solid #fbbf24'
        }}>
          <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
            🎊 Summer promotion ends on <strong>{promotionEndDate}</strong>. Prices will return to regular rates afterward. 🎊
          </p>
        </div>
      )}

      {/* Close Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <button 
          onClick={onClose} 
          style={{ 
            color: '#9CA3AF', 
            fontSize: '13px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '20px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Close
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};