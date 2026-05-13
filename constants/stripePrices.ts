// Stripe price IDs - what your components expect
export const STRIPE_PRICE_IDS = {
  PRO_LITE_MONTHLY: 'price_1TNBwv2RTqNKntjqa32KcySy',
  PRO_LITE_ANNUAL: 'price_1TNC212RTqNKntjq8Yuf1Cqb',
  INSTITUTIONAL_MONTHLY: 'price_1TNC4V2RTqNKntjqBDqRlqG7',
  INSTITUTIONAL_ANNUAL: 'price_1TNC7C2RTqNKntjqkXWqZumI',
  COFFEE_MONTHLY: 'price_1TVLFX2RTqNKntjqdZZ0lKBj',
  TOPUP_100_CREDITS: 'price_1TVLFX2RTqNKntjqdZZ0lKBj',
};

// Also export the alternative naming for compatibility
export const STRIPE_PRICES = STRIPE_PRICE_IDS;

// Price amounts
export const PRICE_AMOUNTS = {
  PRO_MONTHLY: 2900,
  PRO_YEARLY: 29000,
  ENTERPRISE: 9900,
};
