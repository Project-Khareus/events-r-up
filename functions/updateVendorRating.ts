import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { vendorId } = await req.json();

        if (!vendorId) {
            return Response.json({ error: 'Vendor ID required' }, { status: 400 });
        }

        // Get all reviews for this vendor
        const reviews = await base44.asServiceRole.entities.Review.filter({ vendor_id: vendorId });

        if (reviews.length === 0) {
            // No reviews, set rating to 0
            await base44.asServiceRole.entities.Vendor.update(vendorId, { rating: 0 });
            return Response.json({ success: true, rating: 0, reviewCount: 0 });
        }

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

        // Update vendor with new rating
        await base44.asServiceRole.entities.Vendor.update(vendorId, { 
            rating: roundedRating 
        });

        return Response.json({ 
            success: true, 
            rating: roundedRating, 
            reviewCount: reviews.length 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});