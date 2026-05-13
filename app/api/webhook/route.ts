import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ensure the webhook doesn't use cached data
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // If verification fails, ensure this matches your Stripe Dashboard API version
  apiVersion: '2023-10-16' as any, 
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing signature', { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const email = session.customer_details?.email;
    
    // Ensure the metadata key matches what you send in /api/checkout
    const creditsToAdd = parseInt(session.metadata?.credits_to_add || '100');

    console.log(`Stripe Success: User ${email} purchased ${creditsToAdd} credits.`);

    if (email) {
      const { error } = await supabase.rpc('increment_credits', {
        user_email_input: email,
        amount: creditsToAdd,
      });

      if (error) {
        console.error('Supabase RPC Error:', error);
        return new NextResponse('Database Error', { status: 500 });
      }
    }
  }

  // Always return 200 OK to Stripe to stop them from retrying
  return NextResponse.json({ received: true }, { status: 200 });
}