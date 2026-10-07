import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, action } = await req.json();
    if (!bookingId || !['created', 'confirmed'].includes(action)) {
      return Response.json({ error: 'Valid booking ID and action required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
    if (user.role !== 'admin' && booking.user_id !== user.id && vendor.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await base44.asServiceRole.entities.VendorAnalytics.filter({ vendor_id: booking.vendor_id, date: today });
    const current = existing[0];
    const bookingIncrement = action === 'created' ? 1 : 0;
    const confirmedIncrement = action === 'confirmed' ? 1 : 0;
    const revenueIncrement = confirmedIncrement && vendor.starting_price ? vendor.starting_price : 0;

    if (current) {
      await base44.asServiceRole.entities.VendorAnalytics.update(current.id, {
        total_bookings: (current.total_bookings || 0) + bookingIncrement,
        confirmed_bookings: (current.confirmed_bookings || 0) + confirmedIncrement,
        revenue: (current.revenue || 0) + revenueIncrement
      });
    } else {
      await base44.asServiceRole.entities.VendorAnalytics.create({
        vendor_id: booking.vendor_id, date: today, profile_views: 0,
        total_bookings: bookingIncrement, confirmed_bookings: confirmedIncrement, revenue: revenueIncrement
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}