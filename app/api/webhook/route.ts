import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Stripe only if key exists
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',  // Changed to a valid current version
    })
  : null;

// Initialize Supabase only if URLs exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: Request) {
  // Check if services are configured
  if (!stripe) {
    console.error('❌ Stripe not configured: Missing STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
  }

  if (!supabase) {
    console.error('❌ Supabase not configured: Missing Supabase URL or key');
    return NextResponse.json({ error: 'Database service not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const email = session.customer_details?.email;
      const creditsToAdd = parseInt(session.metadata?.credits_to_add || '100');

      console.log(`💰 Processing checkout for: ${email}, credits: ${creditsToAdd}`);

      if (email) {
        // First try: Use the increment_credits RPC function
        const { error: rpcError } = await supabase.rpc('increment_credits', {
          user_email_input: email,
          amount: creditsToAdd,
        });
        
        if (rpcError) {
          console.error('❌ Supabase RPC error:', rpcError);
          
          // Fallback: Get current credits and update directly
          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('email', email)
            .single();
          
          if (fetchError) {
            console.error('❌ Failed to fetch profile:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
          }
          
          const currentCredits = profile?.credits || 0;
          const newCredits = currentCredits + creditsToAdd;
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('email', email);
          
          if (updateError) {
            console.error('❌ Fallback update failed:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }
          
          console.log(`✅ Fallback: Added ${creditsToAdd} credits to ${email} (${currentCredits} -> ${newCredits})`);
        } else {
          console.log(`✅ Successfully added ${creditsToAdd} credits to ${email}`);
        }
      }
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    stripe_configured: !!stripe,
    supabase_configured: !!supabase,
    timestamp: new Date().toISOString()
  });
}
