import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { vendorId } = await req.json();

        if (!vendorId) {
            return Response.json({ error: 'Vendor ID required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        // Use service role to bypass RLS
        const existing = await base44.asServiceRole.entities.VendorAnalytics.filter({
            vendor_id: vendorId,
            date: today
        });

        if (existing.length > 0) {
            // Update existing entry
            await base44.asServiceRole.entities.VendorAnalytics.update(existing[0].id, {
                profile_views: (existing[0].profile_views || 0) + 1
            });
        } else {
            // Create new entry
            await base44.asServiceRole.entities.VendorAnalytics.create({
                vendor_id: vendorId,
                date: today,
                profile_views: 1,
                total_bookings: 0,
                confirmed_bookings: 0,
                revenue: 0
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});