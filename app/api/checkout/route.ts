import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, 
});

const priceMap: Record<string, string> = {
  'pro_monthly': 'price_1TNAtdE1UbMTxG27hjgZ1SvU',
  'pro_annual': 'price_1TNCDSE1UbMTxG27CgiD7QV7', // Changed from yearly to annual
  'inst_monthly': 'price_1TNAw3E1UbMTxG27aDkw1pvl',
  'inst_annual': 'price_1TNCEzE1UbMTxG27eUnA2jsb', // Changed from yearly to annual
  'explorer_monthly': 'YOUR_COFFEE_PRICE_ID' // Add your $5 price ID here
};

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { planKey, billingCycle, userId } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const lookupKey = `${planKey}_${billingCycle}`;
    const priceId = priceMap[lookupKey];

    if (!priceId) {
      console.error('Missing Price ID for:', lookupKey);
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 });
    }

    // Set dynamic credits based on planKey
    let creditsValue = '100';
    if (planKey === 'pro') creditsValue = '1500';
    if (planKey === 'inst') creditsValue = '8000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planKey === 'explorer' ? 'payment' : 'subscription', // Coffee is a one-time payment
      client_reference_id: userId,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#pricing`,
      metadata: {
        plan: planKey,
        billing: billingCycle,
        credits_to_add: creditsValue, 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}