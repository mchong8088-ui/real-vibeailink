// app/api/billing/create-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function POST(request: Request) {
  try {
    const { priceId, userId, successUrl, cancelUrl } = await request.json();
    
    console.log('Creating checkout session for priceId:', priceId);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${request.headers.get('origin')}/success`,
      cancel_url: cancelUrl || `${request.headers.get('origin')}/`,
      metadata: {
        userId: userId || '',
      },
      customer_creation: 'always', // Creates a Stripe customer automatically
    });
    
    console.log('Checkout session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}