import { createClient } from '@supabase/supabase-js';

import { NextResponse } from 'next/server';

import Stripe from 'stripe';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);



export async function POST(req: Request) {

  const body = await req.text();

  const signature = req.headers.get('stripe-signature') as string;



  let event;

  try {

    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

  } catch (err: any) {

    return new NextResponse('Webhook Error', { status: 400 });

  }



  if (event.type === 'checkout.session.completed') {

    const session = event.data.object as any;

    const email = session.customer_details?.email;

    const creditsToAdd = parseInt(session.metadata?.credits_to_add || '100');



    console.log(`收到 Stripe 成功訊號，用戶: ${email}, 點數: ${creditsToAdd}`);



    const { error } = await supabase.rpc('increment_credits', {

      user_email_input: email,

      amount: creditsToAdd,

    });



    if (error) {

      console.error('Supabase RPC 錯誤:', error);

      return new NextResponse('Database Error', { status: 500 });

    }

  }



  return new NextResponse('OK', { status: 200 });

}