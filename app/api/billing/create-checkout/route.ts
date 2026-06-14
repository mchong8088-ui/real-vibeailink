import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, successUrl, cancelUrl, planId } = await req.json();
    
    console.log("💰 Creating checkout session:", { priceId, userId, planId });
    
    // Check if this is a top-up (one-time payment)
    const isTopUp = planId === 'topup' || planId === 'coffee_topup' || priceId?.includes('TOPUP');
    
    // Build session configuration
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vibeailink.com'}/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vibeailink.com'}/`,
      client_reference_id: userId,
      metadata: {
        userId: userId || '',
        planId: planId || '',
        type: isTopUp ? 'topup' : 'subscription',
      },
    };
    
    // Set mode based on plan type
    if (isTopUp) {
      sessionConfig.mode = 'payment';  // One-time payment for top-up
      console.log("☕ Creating one-time payment session for top-up with price ID:", priceId);
    } else {
      sessionConfig.mode = 'subscription';  // Subscription for recurring plans
      console.log("📅 Creating subscription session for plan:", planId);
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log("✅ Checkout session created:", session.id, "URL:", session.url);
    
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}