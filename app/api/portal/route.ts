import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // 尋找客戶
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return NextResponse.json({ error: '在 Stripe 找不到此用戶，請先完成一次購買。' }, { status: 404 });
    }

    // 創建 Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`, // 回到首頁
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Portal API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}