import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BRAND = 'Khareus';
const SITE_URL = 'https://eventsrup.com';

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

function infoCard(items, borderColor = '#4F46E5') {
    return `
    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
        ${items.map(([label, value]) => value ? `<p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>${label}:</strong> ${value}</p>` : '').join('')}
    </div>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const oneDayFromNow = new Date(today);
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];
        const oneDayDate = oneDayFromNow.toISOString().split('T')[0];

        const allBookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed' });

        let remindersSent = 0;

        for (const booking of allBookings) {
            if (!booking.event_date) continue;

            const eventDate = booking.event_date;
            let daysUntilEvent = null;

            if (eventDate === sevenDaysDate) daysUntilEvent = 7;
            else if (eventDate === oneDayDate) daysUntilEvent = 1;

            if (daysUntilEvent) {
                const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);
                if (!vendor) continue;

                // Customer email
                if (booking.user_email) {
                    const subject = daysUntilEvent === 1 
                        ? `🎉 Your Event with ${vendor.business_name} is Tomorrow!`
                        : `📅 Event Reminder: ${daysUntilEvent} Days to Go`;

                    const tips = daysUntilEvent === 7 ? `
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">It's a good time to:</p>
                        <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
                            <li>Confirm final details with the vendor</li>
                            <li>Review any special requests or requirements</li>
                            <li>Ensure payment arrangements are complete</li>
                        </ul>
                    ` : `
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                            Your event is tomorrow! Make sure everything is ready and don't hesitate to contact the vendor if you have any last-minute questions.
                        </p>
                    `;

                    const content = `
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${booking.user_name},</p>
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                            Your event with <strong>${vendor.business_name}</strong> is coming up ${daysUntilEvent === 1 ? 'tomorrow' : `in ${daysUntilEvent} days`}!
                        </p>
                        ${infoCard([
                            ['Vendor', vendor.business_name],
                            ['Event Date', eventDate],
                            ['Guest Count', booking.guest_count],
                            ['Contact', vendor.contact_phone]
                        ])}
                        ${tips}
                        ${button('Message Vendor', `${SITE_URL}/Messages`)}
                        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">We hope your event is amazing! 🎊</p>
                    `;

                    await base44.integrations.Core.SendEmail({
                        to: booking.user_email,
                        subject,
                        body: emailTemplate('Event Reminder', '#4F46E5', content)
                    });
                    remindersSent++;
                }

                // Vendor email
                let vendorEmail = vendor.contact_email;
                if (!vendorEmail && vendor.user_id) {
                    const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
                    vendorEmail = vendorUser?.email;
                }

                if (vendorEmail) {
                    const vendorContent = `
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${vendor.business_name},</p>
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                            You have an event ${daysUntilEvent === 1 ? 'tomorrow' : `in ${daysUntilEvent} days`}.
                        </p>
                        ${infoCard([
                            ['Customer', booking.user_name],
                            ['Email', booking.user_email],
                            ['Event Date', eventDate],
                            ['Guest Count', booking.guest_count]
                        ])}
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                            Please ensure all preparations are on track for a successful event!
                        </p>
                        ${button('View Booking Details', `${SITE_URL}/Bookings`)}
                    `;

                    await base44.integrations.Core.SendEmail({
                        to: vendorEmail,
                        subject: `📅 Event Reminder: ${booking.user_name} - ${eventDate}`,
                        body: emailTemplate('Upcoming Event Reminder', '#4F46E5', vendorContent)
                    });
                    remindersSent++;
                }
            }
        }

        return Response.json({ 
            success: true, 
            remindersSent,
            message: `Sent ${remindersSent} event reminder emails`
        });
    } catch (error) {
        console.error('Error sending booking reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});