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

    // Pricing
    const prices = {
      monthly: { amount: 4900, interval: 'month' }, // $49/month
      annual: { amount: 49000, interval: 'year' }   // $490/year (10 months price)
    };

    const selectedPrice = prices[subscription_type];
    if (!selectedPrice) {
      return Response.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: subscription_type === 'monthly' ? 'Monthly Vendor Subscription' : 'Annual Vendor Subscription',
              description: subscription_type === 'monthly' 
                ? 'Access to Omnievents vendor marketplace - billed monthly'
                : 'Access to Omnievents vendor marketplace - 12 months for the price of 10',
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