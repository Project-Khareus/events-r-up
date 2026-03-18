import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, action } = await req.json();

        if (!bookingId || !action) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get booking details
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookings[0];
        const today = new Date().toISOString().split('T')[0];

        // Get or create analytics entry for today
        const analytics = await base44.asServiceRole.entities.VendorAnalytics.filter({
            vendor_id: booking.vendor_id,
            date: today
        });

        if (analytics.length > 0) {
            // Update existing
            const current = analytics[0];
            const updates = {
                total_bookings: (current.total_bookings || 0) + (action === 'created' ? 1 : 0),
                confirmed_bookings: (current.confirmed_bookings || 0) + (action === 'confirmed' ? 1 : 0)
            };

            // Calculate revenue based on vendor starting price when booking is confirmed
            if (action === 'confirmed' && booking.vendor_id) {
                const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
                if (vendors.length > 0 && vendors[0].starting_price) {
                    updates.revenue = (current.revenue || 0) + vendors[0].starting_price;
                }
            }

            await base44.asServiceRole.entities.VendorAnalytics.update(current.id, updates);
        } else {
            // Create new entry
            const newAnalytics = {
                vendor_id: booking.vendor_id,
                date: today,
                total_bookings: action === 'created' ? 1 : 0,
                confirmed_bookings: action === 'confirmed' ? 1 : 0,
                profile_views: 0,
                revenue: 0
            };

            // Calculate revenue for new entry if confirmed
            if (action === 'confirmed' && booking.vendor_id) {
                const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
                if (vendors.length > 0 && vendors[0].starting_price) {
                    newAnalytics.revenue = vendors[0].starting_price;
                }
            }

            await base44.asServiceRole.entities.VendorAnalytics.create(newAnalytics);
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});