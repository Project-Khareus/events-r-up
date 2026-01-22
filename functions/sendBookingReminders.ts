import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function should be called by a scheduled automation
        // Send reminders for bookings happening in 7 days or 1 day
        
        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const oneDayFromNow = new Date(today);
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];
        const oneDayDate = oneDayFromNow.toISOString().split('T')[0];

        // Fetch confirmed bookings
        const allBookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed' });

        let remindersSent = 0;

        for (const booking of allBookings) {
            if (!booking.event_date) continue;

            const eventDate = booking.event_date;
            let daysUntilEvent = null;

            if (eventDate === sevenDaysDate) {
                daysUntilEvent = 7;
            } else if (eventDate === oneDayDate) {
                daysUntilEvent = 1;
            }

            if (daysUntilEvent) {
                // Fetch vendor details
                const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);

                if (!vendor) continue;

                // Send email to customer
                if (booking.user_email) {
                    const subject = daysUntilEvent === 1 
                        ? `🎉 Your Event with ${vendor.business_name} is Tomorrow!`
                        : `📅 Event Reminder: ${daysUntilEvent} Days to Go`;

                    await base44.integrations.Core.SendEmail({
                        to: booking.user_email,
                        subject: subject,
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #4F46E5;">Event Reminder</h1>
                                <p>Hi ${booking.user_name},</p>
                                <p>Your event with <strong>${vendor.business_name}</strong> is coming up ${daysUntilEvent === 1 ? 'tomorrow' : `in ${daysUntilEvent} days`}!</p>
                                
                                <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                                    <p><strong>Vendor:</strong> ${vendor.business_name}</p>
                                    <p><strong>Event Date:</strong> ${eventDate}</p>
                                    <p><strong>Guest Count:</strong> ${booking.guest_count}</p>
                                    ${vendor.contact_phone ? `<p><strong>Contact:</strong> ${vendor.contact_phone}</p>` : ''}
                                </div>
                                
                                ${daysUntilEvent === 7 ? `
                                    <p>It's a good time to:</p>
                                    <ul>
                                        <li>Confirm final details with the vendor</li>
                                        <li>Review any special requests or requirements</li>
                                        <li>Ensure payment arrangements are complete</li>
                                    </ul>
                                ` : `
                                    <p>Your event is tomorrow! Make sure everything is ready and don't hesitate to contact the vendor if you have any last-minute questions.</p>
                                `}
                                
                                <a href="https://eventsrup.com/Messages" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Message Vendor</a>
                                
                                <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
                                    We hope your event is amazing! 🎊
                                </p>
                            </div>
                        `
                    });

                    remindersSent++;
                }

                // Send reminder to vendor too
                let vendorEmail = vendor.contact_email;
                if (!vendorEmail && vendor.user_id) {
                    const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
                    vendorEmail = vendorUser?.email;
                }

                if (vendorEmail) {
                    await base44.integrations.Core.SendEmail({
                        to: vendorEmail,
                        subject: `📅 Event Reminder: ${booking.user_name} - ${eventDate}`,
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #4F46E5;">Upcoming Event Reminder</h1>
                                <p>Hi ${vendor.business_name},</p>
                                <p>You have an event ${daysUntilEvent === 1 ? 'tomorrow' : `in ${daysUntilEvent} days`}.</p>
                                
                                <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p><strong>Customer:</strong> ${booking.user_name}</p>
                                    <p><strong>Email:</strong> ${booking.user_email}</p>
                                    <p><strong>Event Date:</strong> ${eventDate}</p>
                                    <p><strong>Guest Count:</strong> ${booking.guest_count}</p>
                                </div>
                                
                                <p>Please ensure all preparations are on track for a successful event!</p>
                                
                                <a href="https://eventsrup.com/Bookings" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Booking Details</a>
                            </div>
                        `
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