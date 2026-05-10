// constants/stripePrices.ts
// Add your actual Price IDs from Stripe Dashboard here

export const STRIPE_PRICE_IDS = {
  // Pro Lite Plan
  PRO_LITE_MONTHLY: 'price_1TNBwv2RTqNKntjqa32KcySy',
  PRO_LITE_ANNUAL: 'price_1TNC212RTqNKntjq8Yuf1Cqb',
  
  // Institutional Plan
  INSTITUTIONAL_MONTHLY: 'price_1TNC4V2RTqNKntjqBDqRlqG7',
  INSTITUTIONAL_ANNUAL: 'price_1TNC7C2RTqNKntjqkXWqZumI',
  
  // Coffee Plan (Retention) - USING THE CORRECT ID FROM SCREENSHOT
  COFFEE_MONTHLY: 'price_1TVLFX2RTqNKntjqdZZ0lKBj',  // ← Note the zero "0", not capital "O"
  
  // Top-up (100 credits for $5)
  TOPUP_100_CREDITS: 'price_1TVLFX2RTqNKntjqdZZ0lKBj',  // ← Same ID with zero
};