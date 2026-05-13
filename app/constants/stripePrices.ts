// app/constants/stripePrices.ts

// Stripe price IDs for different subscription tiers
export const STRIPE_PRICES = {
  FREE: 'price_free',
  PRO_MONTHLY: 'price_pro_monthly',
  PRO_YEARLY: 'price_pro_yearly',
  ENTERPRISE: 'price_enterprise',
};

// Price amounts in USD (cents)
export const PRICE_AMOUNTS = {
  PRO_MONTHLY: 2900, // $29.00
  PRO_YEARLY: 29000, // $290.00
  ENTERPRISE: 9900,  // $99.00 (custom)
};

// Feature flags for each tier
export const TIER_FEATURES = {
  FREE: {
    maxStocks: 3,
    refreshRate: 60, // minutes
    historicalRange: '1mo',
    aiAnalyses: 5, // per month
  },
  PRO: {
    maxStocks: 50,
    refreshRate: 5, // minutes
    historicalRange: '1y',
    aiAnalyses: 100, // per month
  },
  ENTERPRISE: {
    maxStocks: 999,
    refreshRate: 1, // minutes
    historicalRange: '5y',
    aiAnalyses: 9999, // per month
  },
};