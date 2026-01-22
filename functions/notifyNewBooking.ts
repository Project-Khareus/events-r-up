import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { bookingId } = await req.json();

        if (!bookingId) {
            return Response.json({ error: 'Booking ID required' }, { status: 400 });
        }

        // Fetch booking details
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        
        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch vendor details
        const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);

        // Get vendor email
        let vendorEmail = vendor.contact_email;
        if (!vendorEmail && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            vendorEmail = vendorUser?.email;
        }

        // Email to vendor
        if (vendorEmail) {
            await base44.integrations.Core.SendEmail({
                to: vendorEmail,
                subject: `🎉 New Booking Request from ${booking.user_name}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">New Booking Request!</h1>
                        <p>You have received a new booking request for <strong>${vendor.business_name}</strong>.</p>
                        
                        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Customer:</strong> ${booking.user_name}</p>
                            <p><strong>Email:</strong> ${booking.user_email}</p>
                            <p><strong>Event Date:</strong> ${booking.event_date}</p>
                            <p><strong>Guest Count:</strong> ${booking.guest_count}</p>
                            ${booking.message ? `<p><strong>Message:</strong> ${booking.message}</p>` : ''}
                        </div>
                        
                        <p>Please review and respond to this booking request promptly.</p>
                        
                        <a href="https://eventsrup.com/Bookings" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Booking</a>
                    </div>
                `
            });
        }

        // Email to customer
        if (booking.user_email) {
            await base44.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: `Booking Request Sent to ${vendor.business_name}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">Booking Request Received</h1>
                        <p>Hi ${booking.user_name},</p>
                        <p>Your booking request has been sent to <strong>${vendor.business_name}</strong>.</p>
                        
                        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Event Date:</strong> ${booking.event_date}</p>
                            <p><strong>Guest Count:</strong> ${booking.guest_count}</p>
                            <p><strong>Status:</strong> Pending vendor confirmation</p>
                        </div>
                        
                        <p>The vendor will review your request and get back to you soon. You'll receive another email once they respond.</p>
                        
                        <a href="https://eventsrup.com/Bookings" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View My Bookings</a>
                    </div>
                `
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending booking notifications:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});