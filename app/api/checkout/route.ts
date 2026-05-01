import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, 
});

const priceMap: Record<string, string> = {
  'pro_monthly': 'price_1TNAtdE1UbMTxG27hjgZ1SvU',
  'pro_yearly': 'price_1TNCDSE1UbMTxG27CgiD7QV7',
  'inst_monthly': 'price_1TNAw3E1UbMTxG27aDkw1pvl',
  'inst_yearly': 'price_1TNCEzE1UbMTxG27eUnA2jsb',
};

export async function POST(req: Request) {
  try {
    const { planKey, billingCycle } = await req.json();

    // 1. 安全地獲取 URL，如果環境變數不存在，預設使用 localhost:3000
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // 2. 驗證 PriceID
    const priceId = priceMap[`${planKey}_${billingCycle}`];
    if (!priceId) {
      console.error('Missing Price ID for:', `${planKey}_${billingCycle}`);
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // 3. 建立 Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      
      // 【新增這一行】
      // 建議在這裡先暫時填入一個固定的 ID 來測試流程是否通暢
      client_reference_id: "123e4567-e89b-12d3-a456-426614174000",
      
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#pricing`,
      metadata: {
        plan: planKey,
        billing: billingCycle,
        credits_to_add: planKey === 'pro' ? '1500' : '8000', 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}