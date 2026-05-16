// app/api/billing/create-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, successUrl, cancelUrl } = await req.json();
    
    console.log("Creating checkout session for priceId:", priceId);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',  // Important: use 'subscription' for recurring payments
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      client_reference_id: userId,
      // Remove customer_creation if it's causing issues
      // customer_creation: 'always',  // ← Remove or comment this line
      metadata: {
        userId: userId || '',
      },
    });

    console.log("Checkout session created:", session.id);
    
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}