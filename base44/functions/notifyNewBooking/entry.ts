import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { escapeHtml } from '../../shared/emailLayout.js';

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

function button(text, url, color = '#A97E2E') {
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
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const { bookingId, skipCustomerEmail = false, quoteVendorCount = 1 } = await req.json();

        if (!bookingId) {
            return Response.json({ error: 'Booking ID required' }, { status: 400 });
        }

        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);
        if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
        if (user.role !== 'admin' && booking.user_id !== user.id && vendor.user_id !== user.id) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const vendorName = escapeHtml(vendor.business_name);
        const customerName = escapeHtml(booking.user_name);
        const customerEmail = escapeHtml(booking.user_email);
        const eventDate = escapeHtml(booking.event_date);
        const guestCount = escapeHtml(booking.guest_count);
        const bookingMessage = escapeHtml(booking.message);
        const isQuote = booking.request_type === 'quote';
        const eventLabels: Record<string, string> = { weddings: 'Wedding', parties: 'Party', conference: 'Conference', funeral: 'Funeral', other: 'Other' };
        const cur = booking.budget_currency || 'GHS';
        const budget = booking.budget_min && booking.budget_max
            ? `${cur} ${booking.budget_min} – ${booking.budget_max}`
            : booking.budget_max ? `Up to ${cur} ${booking.budget_max}` : booking.budget_min ? `From ${cur} ${booking.budget_min}` : '';

        let vendorEmail = vendor.contact_email;
        if (!vendorEmail && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            vendorEmail = vendorUser?.email;
        }

        // Email to vendor
        if (vendorEmail) {
            const vendorContent = isQuote ? `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    <strong>${customerName}</strong> would like a price from <strong>${vendorName}</strong>.
                </p>
                ${infoCard([
                    ['Event', escapeHtml(eventLabels[booking.event_type] || booking.event_type || '')],
                    ['Event Date', eventDate],
                    ['Location', escapeHtml(booking.location || '')],
                    ['Guests', guestCount],
                    ['Budget', escapeHtml(budget)],
                    ['Details', bookingMessage]
                ])}
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Customers often ask a few vendors at once, so replying quickly gives you the best chance. Send your price from your Booking Requests page.
                </p>
                ${button('Send your quote', `${SITE_URL}/Bookings`)}
            ` : `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    You have received a new booking request for <strong>${vendorName}</strong>.
                </p>
                ${infoCard([
                    ['Customer', customerName],
                    ['Email', customerEmail],
                    ['Event Date', eventDate],
                    ['Guest Count', guestCount],
                    ['Message', bookingMessage]
                ])}
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Please review and respond to this booking request promptly.
                </p>
                ${button('View Booking', `${SITE_URL}/Bookings`)}
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: vendorEmail,
                subject: isQuote ? `New quote request from ${booking.user_name}` : `New Booking Request from ${booking.user_name}`,
                body: emailTemplate(isQuote ? 'New Quote Request' : 'New Booking Request', '#A97E2E', vendorContent)
            });
        }

        // Email to customer (sent once for a multi-vendor quote request)
        if (booking.user_email && isQuote && !skipCustomerEmail) {
            const n = Number(quoteVendorCount) || 1;
            const quoteContent = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${customerName},</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Your quote request has been sent to ${n > 1 ? `<strong>${n} vendors</strong>` : `<strong>${vendorName}</strong>`}.
                    We'll email you as soon as a price comes back, and you can compare quotes in My Bookings.
                </p>
                ${infoCard([
                    ['Event Date', eventDate],
                    ['Guests', guestCount],
                    ['Budget', escapeHtml(budget)]
                ])}
                ${button('View my requests', `${SITE_URL}/Bookings`)}
            `;
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: n > 1 ? `Your quote request was sent to ${n} vendors` : `Your quote request was sent to ${vendor.business_name}`,
                body: emailTemplate('Quote Request Sent', '#A97E2E', quoteContent)
            });
        }

        // Email to customer (direct booking)
        if (booking.user_email && !isQuote) {
            const customerContent = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Hi ${customerName},
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Your booking request has been sent to <strong>${vendorName}</strong>.
                </p>
                ${infoCard([
                    ['Event Date', eventDate],
                    ['Guest Count', guestCount],
                    ['Status', 'Pending vendor confirmation']
                ])}
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    The vendor will review your request and get back to you soon. You'll receive another email once they respond.
                </p>
                ${button('View My Bookings', `${SITE_URL}/Bookings`)}
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: `Booking Request Sent to ${vendor.business_name}`,
                body: emailTemplate('Booking Request Received', '#A97E2E', customerContent)
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending booking notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});