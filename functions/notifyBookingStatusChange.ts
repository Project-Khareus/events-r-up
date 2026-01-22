import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { bookingId, newStatus } = await req.json();

        if (!bookingId || !newStatus) {
            return Response.json({ error: 'Booking ID and status required' }, { status: 400 });
        }

        // Fetch booking details
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        
        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);

        // Prepare email content based on status
        let subject = '';
        let statusColor = '';
        let statusEmoji = '';
        let message = '';

        if (newStatus === 'confirmed') {
            subject = `✅ Booking Confirmed with ${vendor.business_name}`;
            statusColor = '#10B981';
            statusEmoji = '✅';
            message = `Great news! Your booking with <strong>${vendor.business_name}</strong> has been confirmed.`;
        } else if (newStatus === 'declined') {
            subject = `Booking Update from ${vendor.business_name}`;
            statusColor = '#DC2626';
            statusEmoji = '❌';
            message = `Unfortunately, <strong>${vendor.business_name}</strong> is unable to accept your booking request.`;
        } else if (newStatus === 'completed') {
            subject = `Thanks for choosing ${vendor.business_name}!`;
            statusColor = '#8B5CF6';
            statusEmoji = '🎉';
            message = `Your event with <strong>${vendor.business_name}</strong> is complete. We hope everything went smoothly!`;
        }

        // Email to customer
        if (booking.user_email && subject) {
            await base44.integrations.Core.SendEmail({
                to: booking.user_email,
                subject: subject,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: ${statusColor};">${statusEmoji} Booking Update</h1>
                        <p>Hi ${booking.user_name},</p>
                        <p>${message}</p>
                        
                        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                            <p><strong>Vendor:</strong> ${vendor.business_name}</p>
                            <p><strong>Event Date:</strong> ${booking.event_date}</p>
                            <p><strong>Guest Count:</strong> ${booking.guest_count}</p>
                            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
                        </div>
                        
                        ${newStatus === 'confirmed' ? `
                            <p>Your event is all set! If you have any questions, feel free to message the vendor directly through the platform.</p>
                        ` : ''}
                        
                        ${newStatus === 'declined' ? `
                            <p>Don't worry! There are many other great vendors available. Browse our marketplace to find the perfect match for your event.</p>
                            <a href="https://eventsrup.com/VendorMarketplace" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Browse Vendors</a>
                        ` : ''}
                        
                        ${newStatus === 'completed' ? `
                            <p>We'd love to hear about your experience! Please take a moment to leave a review.</p>
                            <a href="https://eventsrup.com/VendorDetail?id=${vendor.id}#reviews" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Leave a Review</a>
                        ` : ''}
                        
                        <a href="https://eventsrup.com/Bookings" style="display: inline-block; padding: 12px 24px; background-color: #64748B; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View All Bookings</a>
                    </div>
                `
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending status change notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});