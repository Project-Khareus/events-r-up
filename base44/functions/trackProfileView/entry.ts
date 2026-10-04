import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { vendorId } = await req.json();

    if (!vendorId) {
      return Response.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId);
    if (!vendor || vendor.status !== 'approved') {
      return Response.json({ success: true, tracked: false });
    }

    const today = new Date().toISOString().split('T')[0];
    const categories = Array.isArray(vendor.category) ? vendor.category : [vendor.category].filter(Boolean);
    const existing = await base44.asServiceRole.entities.VendorAnalytics.filter({
      vendor_id: vendorId,
      date: today
    });
    const categoryViews = { ...(existing[0]?.category_profile_views || {}) };
    categories.forEach((category) => {
      categoryViews[category] = (categoryViews[category] || 0) + 1;
    });

    if (existing.length > 0) {
      await base44.asServiceRole.entities.VendorAnalytics.update(existing[0].id, {
        profile_views: (existing[0].profile_views || 0) + 1,
        category_profile_views: categoryViews
      });
    } else {
      await base44.asServiceRole.entities.VendorAnalytics.create({
        vendor_id: vendorId,
        date: today,
        profile_views: 1,
        category_profile_views: categoryViews,
        total_bookings: 0,
        confirmed_bookings: 0,
        revenue: 0
      });
    }

    return Response.json({ success: true, tracked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}