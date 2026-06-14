import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'as any,
});

export async function POST(req: Request) {
  try {
    const { email, returnUrl } = await req.json();
    
    console.log("Portal API called with email:", email);
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find customer by email
    const customers = await stripe.customers.list({ 
      email: email, 
      limit: 1 
    });
    
    console.log("Customers found:", customers.data.length);
    
    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: 'No subscription found for this email. Please complete a purchase first.' 
      }, { status: 404 });
    }

    const customer = customers.data[0];
    
    // Determine return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.VERCEL_URL || 
                    'http://localhost:3000';
    
    const finalReturnUrl = returnUrl || `${baseUrl}/`;
    
    console.log("Return URL:", finalReturnUrl);
    
    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: finalReturnUrl,
      flow_data: {
        type: 'subscription_cancel',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: `${baseUrl}/thank-you`,
          },
        },
      },
    });

    console.log("Portal session created:", session.url);
    
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Portal API Error:", error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create portal session' 
    }, { status: 500 });
  }
}