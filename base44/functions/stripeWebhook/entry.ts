import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata;

      // Parse vendor data from metadata
      const vendorData = JSON.parse(metadata.vendor_data);
      const userId = metadata.user_id;
      const subscriptionType = metadata.subscription_type;

      // Calculate subscription dates
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      
      if (subscriptionType === 'annual') {
        endDate.setMonth(endDate.getMonth() + 12);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create vendor listing after successful payment
      const finalVendorData = {
        ...vendorData,
        user_id: userId,
        subscription_type: subscriptionType,
        subscription_start_date: startDate,
        subscription_end_date: endDate.toISOString().split('T')[0],
        status: 'pending',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      };

      // Clean up empty fields
      ["contact_email", "website", "instagram", "facebook", "twitter", "tiktok", "linkedin", "image_url"].forEach(key => {
        if (finalVendorData[key] === "") delete finalVendorData[key];
      });

      const newVendor = await base44.asServiceRole.entities.Vendor.create(finalVendorData);

      // Notify admin about new vendor submission
      try {
        await base44.asServiceRole.functions.invoke('notifyVendorSubmission', {
          business_name: newVendor.business_name,
          vendor_id: newVendor.id,
          contact_email: newVendor.contact_email
        });
      } catch (err) {
        console.error("Failed to notify admin", err);
      }

      console.log('Vendor created successfully:', newVendor.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});