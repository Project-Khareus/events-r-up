import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BRAND = 'Khareus';
const SITE_URL = 'https://khareus.com';

function emailTemplate(title, titleColor, content) {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="padding: 32px 24px;">
            <h1 style="color: ${titleColor}; font-size: 24px; margin: 0 0 20px 0;">${title}</h1>
            ${content}
        </div>
        <div style="border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0 0 8px 0;">
                &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
            </p>
            <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                You're receiving this because you have an account on ${BRAND}.
            </p>
        </div>
    </div>`;
}

function button(text, url, color = '#4F46E5') {
    return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">${text}</a>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { reviewId } = await req.json();

        if (!reviewId) {
            return Response.json({ error: 'Review ID required' }, { status: 400 });
        }

        const review = await base44.asServiceRole.entities.Review.get(reviewId);
        if (!review) {
            return Response.json({ error: 'Review not found' }, { status: 404 });
        }

        const vendor = await base44.asServiceRole.entities.Vendor.get(review.vendor_id);
        if (!vendor) {
            return Response.json({ error: 'Vendor not found' }, { status: 404 });
        }

        let vendorEmail = vendor.contact_email;
        if (!vendorEmail && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            vendorEmail = vendorUser?.email;
        }

        const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

        if (vendorEmail) {
            const content = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    You've received a new review for <strong>${vendor.business_name}</strong>.
                </p>
                <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FBBF24;">
                    <div style="font-size: 24px; margin-bottom: 12px;">${stars}</div>
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Rating:</strong> ${review.rating}/5 stars</p>
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>From:</strong> ${review.reviewer_name || 'Anonymous'}</p>
                    ${review.event_type ? `<p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Event Type:</strong> ${review.event_type}</p>` : ''}
                    <p style="margin-top: 16px; font-style: italic; color: #475569; font-size: 14px; line-height: 1.5;">"${review.review_text}"</p>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Thank you for providing excellent service! Reviews help build trust with potential customers.
                </p>
                ${button('View Review', `${SITE_URL}/VendorDetail?id=${vendor.id}#reviews`)}
            `;

            await base44.integrations.Core.SendEmail({
                to: vendorEmail,
                subject: `⭐ New ${review.rating}-Star Review for ${vendor.business_name}`,
                body: emailTemplate('New Customer Review!', '#4F46E5', content)
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending review notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});