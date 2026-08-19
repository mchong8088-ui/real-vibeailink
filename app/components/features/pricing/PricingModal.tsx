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
  langKey?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSelectPlan,
  showRetentionOnly = false,
  langKey = 'English',
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const promotionEndDate = "August 31, 2026";
  
  const isPromotionActive = (): boolean => {
    const today = new Date();
    const endDate = new Date(2026, 7, 31);
    return today <= endDate;
  };
  
  const promotionActive = isPromotionActive();
  
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

  // Language-specific content detection supporting all Chinese variations
  const isChinese = [
    'zh-TW', 'zh-CN', 'zh', 'Chinese', 'Cantonese', 'Mandarin', '繁體', '簡體', '繁體中文', '簡體中文'
  ].some(code => langKey?.toLowerCase().includes(code.toLowerCase()) || langKey === code);

  const getTranslations = () => {
    if (isChinese) {
      return {
        // Plan names
        explorerName: '探索者',
        proLiteName: '專業精簡版',
        institutionalName: '機構版',
        
        // Plan features
        explorerFeatures: [
          '即時股票數據',
          '全球關鍵新聞更新',
          '多語言語音',
          '基礎AI摘要'
        ],
        proLiteFeatures: [
          '包含探索者所有功能',
          '個人URL輸入',
          '即時AI摘要',
          '優先電子郵件支援'
        ],
        institutionalFeatures: [
          '包含專業精簡版所有功能',
          'API 訪問權限',
          '專屬客戶經理',
          '優先處理'
        ],
        
        // Buttons
        join: '加入 →',
        topUp: '儲值 →',
        processing: '處理中...',
        
        // Top-up card
        topUpTitle: '單次計劃：請我喝咖啡！',
        topUpSubtitle: '$5 儲值 100 額度',
        topUpDescription: '更多進階功能',
        
        // Billing toggle
        monthly: '📆 月繳',
        annual: '📅 年繳',
        savePercent: '省20%',
        
        // Promotion
        promoTitle: '🔥 夏日優惠 🔥',
        promoSubtitle: '專業精簡版與機構版 50% 折扣！',
        promoExpires: '⏰ 優惠將於 {date} 到期',
        promoFooter: '🎊 夏日優惠將於 {date} 結束。之後價格將恢復正常。 🎊',
        
        // Misc
        credits: '額度',
        free: '免費',
        billedMonthly: '按月收費',
        billedAnnually: '每年收費 ${amount}',
        popular: '熱門',
        close: '關閉',
        instantCredit: '即時加值 • 永不逾期',
      };
    }
    
    // English (default)
    return {
      explorerName: 'EXPLORER',
      proLiteName: 'PRO LITE',
      institutionalName: 'INSTITUTIONAL',
      
      explorerFeatures: [
        'Real time Stock data',
        'Key Global News updates',
        'Multi-language voice',
        'Basic AI summary'
      ],
      proLiteFeatures: [
        'Everything in Explorer',
        'Personal URL input',
        'Real time AI summary',
        'Priority email support'
      ],
      institutionalFeatures: [
        'Everything in Pro Lite',
        'API access',
        'Dedicated account manager',
        'Priority processing'
      ],
      
      join: 'Join →',
      topUp: 'Top-up →',
      processing: 'Processing...',
      
      topUpTitle: '1-time Plan: Buy me a coffee!',
      topUpSubtitle: '$5 for 100 credits',
      topUpDescription: 'More Advance Features',
      
      monthly: '📆 Monthly',
      annual: '📅 Annual',
      savePercent: 'Save 20%',
      
      promoTitle: '🔥 SUMMER PROMOTION 🔥',
      promoSubtitle: '50% OFF on Pro Lite & Institutional Plans!',
      promoExpires: '⏰ Offer expires on {date}',
      promoFooter: '🎊 Summer promotion ends on {date}. Prices will return to regular rates afterward. 🎊',
      
      credits: 'credits',
      free: 'FREE',
      billedMonthly: 'billed monthly',
      billedAnnually: '${amount} billed annually',
      popular: 'POPULAR',
      close: 'Close',
      instantCredit: 'Instant credit • Never expires',
    };
  };

  const t = getTranslations();

  const handlePlanAction = async (planId: string, isTopUp?: boolean) => {
    setSelectedPlan(planId);
    setLoading(true);
    
    if (planId === 'explorer') {
      if (!user) {
        onClose();
        setLoading(false);
        return;
      } else if (isTopUp) {
        console.log("🔍 Top-up triggered with price ID:", STRIPE_PRICE_IDS.TOPUP_100_CREDITS);
        onSelectPlan('topup', STRIPE_PRICE_IDS.TOPUP_100_CREDITS);
        setLoading(false);
        return;
      }
    } else if (planId === 'prolite') {
      let priceId;
      if (billingCycle === 'monthly') {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_PRO_LITE_MONTHLY : STRIPE_PRICE_IDS.PRO_LITE_MONTHLY;
      } else {
        priceId = promotionActive ? STRIPE_PRICE_IDS.PROMO_PRO_LITE_ANNUAL : STRIPE_PRICE_IDS.PRO_LITE_ANNUAL;
      }
      onSelectPlan(planId, priceId);
    } else if (planId === 'institutional') {
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
      name: t.explorerName,
      shortName: isChinese ? '探索' : 'EXP',
      price: { monthly: 0, annual: 0 },
      promotionPrice: { monthly: 0, annual: 0 },
      originalPrice: { monthly: 0, annual: 0 },
      displayPrice: { monthly: 0, annual: 0 },
      displayOriginal: { monthly: 0, annual: 0 },
      credits: '100',
      period: 'one-time',
      features: t.explorerFeatures,
      buttonText: isExistingUser ? t.topUp : t.join,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'prolite',
      name: t.proLiteName,
      shortName: isChinese ? '專業' : 'PRO',
      displayPrice: { monthly: promotionPrices.monthly.proLite, annual: promotionPrices.annual.proLite },
      displayOriginal: { monthly: originalPrices.monthly.proLite, annual: originalPrices.annual.proLite },
      credits: '1,500',
      period: '/mo',
      features: t.proLiteFeatures,
      buttonText: t.join,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      popular: true
    },
    {
      id: 'institutional',
      name: t.institutionalName,
      shortName: isChinese ? '機構' : 'INST',
      displayPrice: { monthly: promotionPrices.monthly.institutional, annual: promotionPrices.annual.institutional },
      displayOriginal: { monthly: originalPrices.monthly.institutional, annual: originalPrices.annual.institutional },
      credits: '8,000',
      period: '/mo',
      features: t.institutionalFeatures,
      buttonText: t.join,
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
      {promotionActive && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '28px' }}>🎉</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{t.promoTitle}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{t.promoSubtitle}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                {t.promoExpires.replace('{date}', promotionEndDate)}
              </div>
            </div>
            <span style={{ fontSize: '28px' }}>☀️</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#F3F4F6', borderRadius: '9999px', padding: '4px', display: 'inline-flex' }}>
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
              cursor: 'pointer' 
            }}
          >
            {t.monthly}
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
              cursor: 'pointer' 
            }}
          >
            {t.annual} <span style={{ color: '#22C55E', fontSize: '11px', marginLeft: '4px' }}>{t.savePercent}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {plans.map((plan) => (
          <div key={plan.id} style={{ flex: '1 1 0', minWidth: '280px', maxWidth: '320px', background: 'white', borderRadius: '24px', overflow: 'hidden', border: plan.popular ? '2px solid #f5576c' : '1px solid #E5E7EB', boxShadow: plan.popular ? '0 20px 35px -10px rgba(245,87,108,0.3)' : '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            {plan.popular && <div style={{ position: 'absolute', top: '12px', right: '-30px', background: '#f5576c', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 30px', transform: 'rotate(45deg)' }}>{t.popular}</div>}
            <div style={{ background: plan.gradient, padding: '24px 20px', textAlign: 'center', color: 'white' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{plan.name}</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{plan.credits} {t.credits}</p>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
              {currentPrice(plan) === 0 ? (
                <>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>{t.free}</span>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{plan.period}</p>
                </>
              ) : (
                <>
                  {promotionActive && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px', color: '#9CA3AF', textDecoration: 'line-through', marginRight: '8px' }}>${currentOriginalPrice(plan)}</span>
                      <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>50% OFF</span>
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: promotionActive ? '#EF4444' : '#111827' }}>${currentPrice(plan)}</span>
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>/{billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '8px' }}>
                    {billingCycle === 'annual' 
                      ? t.billedAnnually.replace('${amount}', getAnnualTotal(plan))
                      : t.billedMonthly}
                  </p>
                </>
              )}
            </div>
            <div style={{ padding: '20px', flex: 1, minHeight: '180px' }}>
              {plan.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#22C55E', fontSize: '14px' }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#4B5563' }}>{feature}</span>
                </div>
              ))}
              
              {/* Special top-up message for Explorer plan when user is logged in */}
              {plan.id === 'explorer' && isExistingUser && (
                <div style={{
                  marginTop: '16px',
                  marginBottom: '8px',
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>☕✨</div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    color: '#92400E',
                    marginBottom: '6px'
                  }}>
                    {t.topUpTitle}
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#D97706'
                  }}>
                    {t.topUpSubtitle}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#92400E',
                    marginTop: '6px'
                  }}>
                    {t.topUpDescription}
                  </div>
                </div>
              )}
            </div>
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
                  fontSize: '14px' 
                }}
              >
                {loading && selectedPlan === plan.id ? t.processing : `${plan.buttonText}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {promotionActive && (
        <div style={{ textAlign: 'center', marginTop: '32px', padding: '16px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '16px', border: '1px solid #fbbf24' }}>
          <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
            {t.promoFooter.replace('{date}', promotionEndDate)}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '20px' }}>
          {t.close}
        </button>
      </div>
    </div>
  );
};