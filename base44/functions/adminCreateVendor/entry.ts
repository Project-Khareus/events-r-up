import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { vendor_data, owner_email } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!owner_email) {
      return Response.json({ error: 'owner_email is required' }, { status: 400 });
    }

    // Find the target user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: owner_email });
    if (!users || users.length === 0) {
      return Response.json({ error: `No user found with email: ${owner_email}. The user must have an account first.` }, { status: 404 });
    }

    const targetUser = users[0];

    // Separate Ghana Card fields from vendor data
    const { ghana_card_number, ghana_card_image_url, ghana_card_back_image_url, ghana_card_selfie_url, subscription_type, ...restData } = vendor_data;

    const hasGhanaCard = ghana_card_number && ghana_card_image_url && ghana_card_back_image_url && ghana_card_selfie_url;

    // Set up subscription dates
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (subscription_type === 'annual' ? 12 : 1));

    const vendorPayload = {
      ...restData,
      starting_price: restData.starting_price ? parseFloat(restData.starting_price) : undefined,
      years_in_business: restData.years_in_business ? parseInt(restData.years_in_business) : undefined,
      user_id: targetUser.id,
      subscription_type: subscription_type || 'trial',
      is_trial: subscription_type === 'trial',
      subscription_start_date: now.toISOString().split('T')[0],
      subscription_end_date: endDate.toISOString().split('T')[0],
      status: 'approved', // Admin-created listings are auto-approved
      ghana_card_status: hasGhanaCard ? 'pending' : undefined,
    };

    // Create vendor using service role (bypasses RLS created_by check)
    const newVendor = await base44.asServiceRole.entities.Vendor.create(vendorPayload);

    // Create verification record if Ghana Card data was provided
    if (hasGhanaCard) {
      await base44.asServiceRole.entities.VendorVerification.create({
        vendor_id: newVendor.id,
        user_id: targetUser.id,
        ghana_card_number,
        ghana_card_image_url,
        ghana_card_back_image_url,
        ghana_card_selfie_url,
        ghana_card_status: 'pending',
      });
    }

    // Notify the vendor owner
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: targetUser.id,
        type: 'vendor_approved',
        title: 'Vendor Listing Created',
        message: `A vendor listing "${restData.business_name}" has been created for you by the Khareus team and is now live.`,
        link: 'ManageListing',
        action_by: user.full_name || user.email,
        action_type: 'approved',
        vendor_id: newVendor.id,
        vendor_name: restData.business_name,
      });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner_email,
        from_name: 'Khareus',
        subject: `Your Vendor Listing "${restData.business_name}" is Live!`,
        body: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 32px 24px;">
              <h1 style="color: #4F46E5; font-size: 24px; margin: 0 0 20px 0;">Your Listing is Live!</h1>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${targetUser.full_name || 'there'},</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                The Khareus team has created a vendor listing <strong>"${restData.business_name}"</strong> on your behalf. It's already live and visible to event planners!
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">You can edit your listing anytime from your dashboard:</p>
              <a href="https://khareus.com/EditVendor?id=${newVendor.id}" style="display: inline-block; padding: 12px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">Edit My Listing</a>
              <a href="https://khareus.com/ManageListing" style="display: inline-block; padding: 12px 28px; background-color: #ffffff; color: #4F46E5; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0 16px 8px; border: 2px solid #4F46E5;">View Dashboard</a>
            </div>
            <div style="border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
              <p style="color: #94A3B8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Khareus. All rights reserved.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('Failed to send notifications:', e);
    }

    return Response.json({ success: true, vendor_id: newVendor.id });
  } catch (error) {
    console.error('Admin create vendor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});