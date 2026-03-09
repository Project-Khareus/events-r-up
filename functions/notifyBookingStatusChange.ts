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
        const { bookingId, newStatus } = await req.json();

        if (!bookingId || !newStatus) {
            return Response.json({ error: 'Booking ID and status required' }, { status: 400 });
        }

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);

        const statusConfig = {
            confirmed: {
                subject: `✅ Booking Confirmed with ${vendor.business_name}`,
                color: '#10B981',
                title: '✅ Booking Confirmed',
                message: `Great news! Your booking with <strong>${vendor.business_name}</strong> has been confirmed.`,
                extra: `<p style="color: #334155; font-size: 15px; line-height: 1.6;">Your event is all set! If you have any questions, feel free to message the vendor directly through the platform.</p>`
            },
            declined: {
                subject: `Booking Update from ${vendor.business_name}`,
                color: '#DC2626',
                title: 'Booking Update',
                message: `Unfortunately, <strong>${vendor.business_name}</strong> is unable to accept your booking request.`,
                extra: `
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Don't worry! There are many other great vendors available.</p>
                    ${button('Browse Vendors', `${SITE_URL}/VendorMarketplace`)}
                `
            },
            completed: {
                subject: `Thanks for choosing ${vendor.business_name}!`,
                color: '#8B5CF6',
                title: '🎉 Event Complete',
                message: `Your event with <strong>${vendor.business_name}</strong> is complete. We hope everything went smoothly!`,
                extra: `
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">We'd love to hear about your experience! Please take a moment to leave a review.</p>
                    ${button('Leave a Review', `${SITE_URL}/VendorDetail?id=${vendor.id}#reviews`)}
                `
            }
        };

        const config = statusConfig[newStatus];
        if (!config) {
            return Response.json({ success: true, message: 'No email for this status' });
        }

        if (booking.user_email) {
            const content = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${booking.user_name},</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">${config.message}</p>
                <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Vendor:</strong> ${vendor.business_name}</p>
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Event Date:</strong> ${booking.event_date}</p>
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Guest Count:</strong> ${booking.guest_count}</p>
                    <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
                </div>
                ${config.extra}
                ${button('View All Bookings', `${SITE_URL}/Bookings`, '#64748B')}
            `;

            await base44.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: config.subject,
                body: emailTemplate(config.title, config.color, content)
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending status change notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});