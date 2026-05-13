// components/features/pricing/PricingModal.tsx
"use client";
import React, { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSelectPlan: (planId: string, priceId: string) => void;
  showRetentionOnly?: boolean;
}

const plans = {
  explorer: {
    name: "Explorer",
    price: { monthly: 0, annual: 0 },
    credits: "100 one-time",
    features: [
      "Real time Stock data - HK/TW/US markets",
      "Key Global News updates",
      "Cantonese, Mandarin & English voice support",
      "Basic AI summary & Analysis"
    ],
    buttonText: { default: "Get Started", existing: "Top-up Coffee Plan ($5/100 credits)" },
    type: "free"
  },
  proLite: {
    name: "Pro Lite",
    price: { monthly: 29, annual: 23 },
    credits: "1,500 / month",
    features: [
      "Real time Stock data - HK/TW/US markets",
      "Key Global News updates",
      "Cantonese, Mandarin & English voice support",
      "Personal URL input for analysis",
      "Real time AI summary without bias",
      "Priority email support"
    ],
    buttonText: "Go to Plan",
    type: "paid"
  },
  institutional: {
    name: "Institutional",
    price: { monthly: 99, annual: 79 },
    credits: "8,000 / month",
    features: [
      "Everything in Pro Lite",
      "Real time Stock data - HK/TW/US markets",
      "Key Global News updates",
      "Cantonese, Mandarin & English voice support",
      "Personal URL input for analysis",
      "Real time AI summary without bias",
      "API access",
      "Dedicated account manager",
      "Priority processing"
    ],
    buttonText: "Go to Plan",
    type: "paid"
  },
  coffee: {
    name: "☕ Coffee Plan",
    price: { monthly: 10, annual: 10 },
    credits: "300 / month",
    features: [
      "Real time Stock data - HK/TW/US markets",
      "Key Global News updates",
      "Cantonese, Mandarin & English voice support",
      "Personal URL input for analysis",
      "Real time AI summary without bias",
      "Perfect for casual users"
    ],
    buttonText: "Switch to Coffee Plan",
    type: "retention"
  }
};

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
  const displayedPlans = showRetentionOnly 
    ? { coffee: plans.coffee }
    : { explorer: plans.explorer, proLite: plans.proLite, institutional: plans.institutional };

  const handlePlanClick = async (planKey: string) => {
    setSelectedPlan(planKey);
    setLoading(true);
    
    let priceId = '';
    if (planKey === 'coffee') {
      priceId = 'price_coffee_monthly';
    } else if (planKey === 'explorer') {
      if (!user) {
        onClose();
        setLoading(false);
        return;
      } else {
        priceId = 'price_topup_100_credits';
      }
    } else if (planKey === 'proLite') {
      priceId = billingCycle === 'monthly' ? 'price_prolite_monthly' : 'price_prolite_annual';
    } else if (planKey === 'institutional') {
      priceId = billingCycle === 'monthly' ? 'price_institutional_monthly' : 'price_institutional_annual';
    }
    
    onSelectPlan(planKey, priceId);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Billing Toggle - Hide for retention mode */}
      {!showRetentionOnly && (
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-full p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual <span className="text-green-600 text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className={`grid gap-6 ${
        showRetentionOnly ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-3'
      }`}>
        
        {Object.entries(displayedPlans).map(([key, plan]) => {
          const isExplorer = key === 'explorer';
          const buttonText = isExplorer && isExistingUser 
            ? plan.buttonText.existing 
            : (plan.buttonText.default || plan.buttonText);
          
          return (
            <div
              key={key}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
            >
              {/* Header - Orange Background */}
              <div className="bg-orange-500 px-6 py-4 text-center">
                <h3 className="text-xl font-black text-black uppercase tracking-wide">
                  {plan.name}
                </h3>
                {key === 'proLite' && !showRetentionOnly && (
                  <span className="inline-block mt-1 text-xs font-bold text-black/70">
                    Most Popular
                  </span>
                )}
              </div>

              {/* Price Section - Light Blue Background */}
              <div className="bg-blue-50 px-6 py-5 text-center">
                {plan.price[billingCycle] === 0 ? (
                  <div>
                    <span className="text-3xl font-black text-gray-900">FREE</span>
                    <p className="text-sm text-gray-600 mt-1">per month</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-black text-gray-900">${plan.price[billingCycle]}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    {billingCycle === 'annual' && plan.price.annual < plan.price.monthly && (
                      <p className="text-xs text-green-600 mt-1">
                        Save ${(plan.price.monthly * 12 - plan.price.annual).toFixed(0)}/year
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">{plan.credits}</p>
              </div>

              {/* Features List */}
              <div className="flex-1 px-6 py-5">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button - Green Background */}
              <div className="px-6 py-5 bg-gray-50">
                <button
                  onClick={() => handlePlanClick(key)}
                  disabled={loading && selectedPlan === key}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading && selectedPlan === key ? 'Processing...' : buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Close Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onClose}
          className="px-6 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>

      {/* Retention Note for Coffee Plan */}
      {showRetentionOnly && (
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>This plan is designed to keep you with us at a lower cost.</p>
          <p className="mt-1">You'll keep your analysis history and access to all core features.</p>
        </div>
      )}
    </div>
  );
};