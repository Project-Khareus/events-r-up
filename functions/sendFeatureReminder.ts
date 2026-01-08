import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
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

        const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #4F46E5;">💡 Daily Feature Recommendations</h2>
    <p>Here are enhancement opportunities for your platform:</p>
    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${featuresList.split('\n').map(line => `<p style="margin: 8px 0;">${line}</p>`).join('')}
    </div>
    <p style="color: #64748B;">Ready to implement any of these? Just let me know!</p>
</div>
        `;

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'annerquaye@gmail.com',
            subject: '💡 Daily Feature Recommendations for Your Platform',
            body: emailBody
        });

        return Response.json({ 
            success: true, 
            message: 'Sent reminder email to annerquaye@gmail.com' 
        });
    } catch (error) {
        console.error('Error sending feature reminder:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});