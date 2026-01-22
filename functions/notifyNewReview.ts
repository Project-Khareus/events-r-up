import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { reviewId } = await req.json();

        if (!reviewId) {
            return Response.json({ error: 'Review ID required' }, { status: 400 });
        }

        // Fetch review details
        const review = await base44.asServiceRole.entities.Review.get(reviewId);
        
        if (!review) {
            return Response.json({ error: 'Review not found' }, { status: 404 });
        }

        // Fetch vendor details
        const vendor = await base44.asServiceRole.entities.Vendor.get(review.vendor_id);

        if (!vendor) {
            return Response.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Get vendor email
        let vendorEmail = vendor.contact_email;
        if (!vendorEmail && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            vendorEmail = vendorUser?.email;
        }

        // Generate star rating HTML
        const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

        if (vendorEmail) {
            await base44.integrations.Core.SendEmail({
                to: vendorEmail,
                subject: `⭐ New ${review.rating}-Star Review for ${vendor.business_name}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">New Customer Review!</h1>
                        <p>You've received a new review for <strong>${vendor.business_name}</strong>.</p>
                        
                        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FBBF24;">
                            <div style="font-size: 24px; margin-bottom: 10px;">${stars}</div>
                            <p><strong>Rating:</strong> ${review.rating}/5 stars</p>
                            <p><strong>From:</strong> ${review.reviewer_name || 'Anonymous'}</p>
                            ${review.event_type ? `<p><strong>Event Type:</strong> ${review.event_type}</p>` : ''}
                            <p style="margin-top: 15px; font-style: italic;">"${review.review_text}"</p>
                        </div>
                        
                        <p>Thank you for providing excellent service! Reviews help build trust with potential customers.</p>
                        
                        <a href="https://eventsrup.com/VendorDetail?id=${vendor.id}#reviews" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Review</a>
                    </div>
                `
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending review notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});