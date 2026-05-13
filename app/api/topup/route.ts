import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function POST(req: Request) {
  try {
    const { email, amount } = await req.json();

    // 建立一次性付款的 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        credits_to_add: '100' // 這就是傳給 Webhook 的關鍵 metadata
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Coffee Plan - 100 Credits',
              description: '一次性點數補充',
            },
            unit_amount: amount * 100, // $5 = 500
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/thank-you`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Topup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}