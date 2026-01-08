import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all admin users
        const users = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        
        const featuresList = `
• Payment Integration (Stripe)
• Vendor Analytics Dashboard
• Advanced Search & Filtering
• Email Notification System
• Event RSVP & Ticketing
• Vendor Availability Calendar
• Vendor Verification System
• Social Proof Enhancements
• Comparison Feature
• Smart AI Recommendations
• Vendor Packages System
• Event Planning Tools
• Multi-language Support
• Referral Program
• Video Content Support
• Mobile App Features
• Response Time Tracking
• Saved Searches & Alerts
• Portfolio Showcase
• Event Check-in System
        `.trim();

        // Create notification for each admin
        for (const user of users) {
            await base44.asServiceRole.entities.Notification.create({
                user_id: user.id,
                type: 'system',
                title: '💡 Daily Feature Recommendations',
                message: `Here are enhancement opportunities for your platform:\n\n${featuresList}\n\nReady to implement any of these? Let me know!`,
                link: null,
                is_read: false
            });
        }

        return Response.json({ 
            success: true, 
            message: `Sent reminders to ${users.length} admin(s)` 
        });
    } catch (error) {
        console.error('Error sending feature reminder:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});