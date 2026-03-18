import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_type, vendorData } = await req.json();

    // Pricing - matches Stripe products
    const prices = {
      explorer: { amount: 100, interval: 'month' },  // $1/month
      monthly: { amount: 90, interval: 'month' },    // $0.9/month
      annual: { amount: 1000, interval: 'year' }     // $10/year
    };

    const selectedPrice = prices[subscription_type];
    if (!selectedPrice) {
      return Response.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    const planNames = {
      explorer: 'Explorer Plan',
      monthly: 'Monthly Plan',
      annual: 'Annual Plan'
    };

    const planDescriptions = {
      explorer: 'Basic access to Omnievents vendor marketplace',
      monthly: 'Full access to Omnievents vendor marketplace - billed monthly',
      annual: 'Full access to Omnievents vendor marketplace - billed annually'
    };

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planNames[subscription_type],
              description: planDescriptions[subscription_type],
            },
            recurring: {
              interval: selectedPrice.interval,
            },
            unit_amount: selectedPrice.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        subscription_type,
        vendor_data: JSON.stringify(vendorData),
      },
      success_url: `${req.headers.get('origin')}/VendorSignup?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/VendorSignup?canceled=true`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});