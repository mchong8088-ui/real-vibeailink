// Stripe price IDs - what your components expect
export const STRIPE_PRICE_IDS = {
  PRO_LITE_MONTHLY: 'price_1TNAtdE1UbMTxG27hjgZ1SvU',
  PRO_LITE_ANNUAL: 'price_1TNC212RTqNKntjq8Yuf1Cqb',
  INSTITUTIONAL_MONTHLY: 'price_1TNC4V2RTqNKntjqBDqRlqG7',
  INSTITUTIONAL_ANNUAL: 'price_1TNC7C2RTqNKntjqkXWqZumI',
  COFFEE_MONTHLY: 'price_1TSTSZE1UbMTxG27zZwZqhba',
  COFFEE_TOPUP: 'price_1TSTSZE1UbMTxG27zZwZqhba', // Your $5 for 100 credits price ID
};

// Also export the alternative naming for compatibility
export const STRIPE_PRICES = STRIPE_PRICE_IDS;

// Price amounts
export const PRICE_AMOUNTS = {
  COFFEE_MONTHLY: 1000,        // $10/month - 300 credits
  PRO_LITE_MONTHLY: 2900,      // $29/month - 1,500 credits
  PRO_LITE_ANNUAL: 27600,      // $276/year - 1,500 credits/month
  INSTITUTIONAL_MONTHLY: 9900, // $99/month
  INSTITUTIONAL_ANNUAL: 94800, // $948/year
  COFFEE_TOPUP: 500,           // $5 one-time - 100 credits
};
