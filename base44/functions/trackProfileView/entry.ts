import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vendorId } = await req.json();
    if (!vendorId) return Response.json({ error: 'Vendor ID required' }, { status: 400 });

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId);
    if (!vendor || vendor.status !== 'approved') return Response.json({ success: true, tracked: false });
    if (vendor.user_id === user.id) return Response.json({ success: true, tracked: false });

    const today = new Date().toISOString().split('T')[0];
    const priorViews = await base44.asServiceRole.entities.ProfileView.filter({ vendor_id: vendorId, viewer_id: user.id, date: today });
    if (priorViews.length) return Response.json({ success: true, tracked: false });

    await base44.asServiceRole.entities.ProfileView.create({ vendor_id: vendorId, viewer_id: user.id, date: today });
    const existing = await base44.asServiceRole.entities.VendorAnalytics.filter({ vendor_id: vendorId, date: today });
    const categories = Array.isArray(vendor.category) ? vendor.category : [vendor.category].filter(Boolean);
    const categoryViews = { ...(existing[0]?.category_profile_views || {}) };
    categories.forEach((category) => { categoryViews[category] = (categoryViews[category] || 0) + 1; });

    if (existing[0]) {
      await base44.asServiceRole.entities.VendorAnalytics.update(existing[0].id, {
        profile_views: (existing[0].profile_views || 0) + 1,
        category_profile_views: categoryViews
      });
    } else {
      await base44.asServiceRole.entities.VendorAnalytics.create({
        vendor_id: vendorId, date: today, profile_views: 1, category_profile_views: categoryViews,
        total_bookings: 0, confirmed_bookings: 0, revenue: 0
      });
    }

    return Response.json({ success: true, tracked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}