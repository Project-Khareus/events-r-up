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

function infoCard(items) {
    return `
    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
        ${items.map(([label, value]) => value ? `<p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>${label}:</strong> ${value}</p>` : '').join('')}
    </div>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { bookingId } = await req.json();

        if (!bookingId) {
            return Response.json({ error: 'Booking ID required' }, { status: 400 });
        }

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);

        let vendorEmail = vendor.contact_email;
        if (!vendorEmail && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            vendorEmail = vendorUser?.email;
        }

        // Email to vendor
        if (vendorEmail) {
            const vendorContent = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    You have received a new booking request for <strong>${vendor.business_name}</strong>.
                </p>
                ${infoCard([
                    ['Customer', booking.user_name],
                    ['Email', booking.user_email],
                    ['Event Date', booking.event_date],
                    ['Guest Count', booking.guest_count],
                    ['Message', booking.message]
                ])}
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Please review and respond to this booking request promptly.
                </p>
                ${button('View Booking', `${SITE_URL}/Bookings`)}
            `;

            await base44.integrations.Core.SendEmail({
                to: vendorEmail,
                subject: `🎉 New Booking Request from ${booking.user_name}`,
                body: emailTemplate('New Booking Request!', '#4F46E5', vendorContent)
            });
        }

        // Email to customer
        if (booking.user_email) {
            const customerContent = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Hi ${booking.user_name},
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Your booking request has been sent to <strong>${vendor.business_name}</strong>.
                </p>
                ${infoCard([
                    ['Event Date', booking.event_date],
                    ['Guest Count', booking.guest_count],
                    ['Status', 'Pending vendor confirmation']
                ])}
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    The vendor will review your request and get back to you soon. You'll receive another email once they respond.
                </p>
                ${button('View My Bookings', `${SITE_URL}/Bookings`)}
            `;

            await base44.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: `Booking Request Sent to ${vendor.business_name}`,
                body: emailTemplate('Booking Request Received', '#4F46E5', customerContent)
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending booking notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});