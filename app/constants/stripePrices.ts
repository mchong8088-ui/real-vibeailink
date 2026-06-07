// Stripe price IDs - what your components expect
export const STRIPE_PRICE_IDS = {
  // Pro Lite Plans
  PRO_LITE_MONTHLY: 'price_1TNBwv2RTqNKntjqa32KcySy',
  PRO_LITE_ANNUAL: 'price_1TNC212RTqNKntjq8Yuf1Cqb',
  
  // Institutional Plans
  INSTITUTIONAL_MONTHLY: 'price_1TNC4V2RTqNKntjqBDqRlqG7',
  INSTITUTIONAL_ANNUAL: 'price_1TNC7C2RTqNKntjqkXWqZumI',
  
  // Coffee Plan (Monthly subscription)
  COFFEE_MONTHLY: 'price_1TVLGm2RTqNKntjqe6zlFWfN',
  
  // Coffee Top-up (One-time purchase)
  COFFEE_TOPUP: 'price_1TVLFX2RTqNKntjqdZZOlKBj',
  
  // Alias for backward compatibility
  TOPUP_100_CREDITS: 'price_1TVLFX2RTqNKntjqdZZOlKBj',

  // Summer promotional prices (NEW)
  PROMO_PRO_LITE_MONTHLY: 'price_1TfluY2RTqNKntjquZvsb168',
  PROMO_PRO_LITE_ANNUAL: 'price_1Tflxs2RTqNKntjqVnt9mhdJ',
  PROMO_INSTITUTIONAL_MONTHLY: 'price_1Tflvk2RTqNKntjqxRdasrgI',
  PROMO_INSTITUTIONAL_ANNUAL: 'price_1TflzD2RTqNKntjql2QyONmY',
};

// Also export the alternative naming for compatibility
export const STRIPE_PRICES = STRIPE_PRICE_IDS;

// Price amounts in USD (cents)
export const PRICE_AMOUNTS = {
  PRO_MONTHLY: 2900,      // $29.00
  PRO_YEARLY: 29000,      // $290.00
  ENTERPRISE: 9900,       // $99.00
  COFFEE_MONTHLY: 1000,   // $10.00
  COFFEE_TOPUP: 500,      // $5.00
};