import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { vendor_data } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

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
      user_id: user.id,
      subscription_type: subscription_type || 'trial',
      is_trial: subscription_type === 'trial',
      subscription_start_date: now.toISOString().split('T')[0],
      subscription_end_date: endDate.toISOString().split('T')[0],
      status: 'approved',
      ghana_card_status: hasGhanaCard ? 'pending' : undefined,
    };

    const newVendor = await base44.entities.Vendor.create(vendorPayload);

    // Create verification record if Ghana Card data was provided
    if (hasGhanaCard) {
      await base44.entities.VendorVerification.create({
        vendor_id: newVendor.id,
        user_id: user.id,
        ghana_card_number,
        ghana_card_image_url,
        ghana_card_back_image_url,
        ghana_card_selfie_url,
        ghana_card_status: 'pending',
      });
    }

    return Response.json({ success: true, vendorId: newVendor.id, businessName: restData.business_name, hasGhanaCard });
  } catch (error) {
    console.error('Admin create vendor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});