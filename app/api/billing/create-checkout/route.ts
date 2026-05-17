import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia', // Use the version your Stripe package expects
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, successUrl, cancelUrl } = await req.json();
    
    console.log("Creating checkout session for priceId:", priceId);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
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