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
};

// Also export the alternative naming for compatibility
export const STRIPE_PRICES = STRIPE_PRICE_IDS;

// Price amounts in USD (cents)
export const PRICE_AMOUNTS = {
  PRO_MONTHLY: 2900,
  PRO_YEARLY: 29000,
  ENTERPRISE: 9900,
  COFFEE_MONTHLY: 1000,
  COFFEE_TOPUP: 500,
};