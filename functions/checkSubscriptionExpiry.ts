import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function should be called by a scheduled automation
        // Check for vendors whose subscription is expiring in 14 days, 7 days, or 1 day
        
        const today = new Date();
        const fourteenDaysFromNow = new Date(today);
        fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
        
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const oneDayFromNow = new Date(today);
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        const fourteenDaysDate = fourteenDaysFromNow.toISOString().split('T')[0];
        const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0];
        const oneDayDate = oneDayFromNow.toISOString().split('T')[0];

        // Fetch all approved vendors
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ status: 'approved' });

        let notificationsSent = 0;

        for (const vendor of vendors) {
            if (!vendor.subscription_end_date) continue;

            const endDate = vendor.subscription_end_date;
            let daysUntilExpiry = null;
            let urgency = '';

            if (endDate === fourteenDaysDate) {
                daysUntilExpiry = 14;
                urgency = 'early';
            } else if (endDate === sevenDaysDate) {
                daysUntilExpiry = 7;
                urgency = 'reminder';
            } else if (endDate === oneDayDate) {
                daysUntilExpiry = 1;
                urgency = 'urgent';
            }

            if (daysUntilExpiry) {
                // Get vendor email
                let vendorEmail = vendor.contact_email;
                if (!vendorEmail && vendor.user_id) {
                    const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
                    vendorEmail = vendorUser?.email;
                }

                if (vendorEmail) {
                    const subject = daysUntilExpiry === 1 
                        ? `⚠️ Your Omnievents Subscription Expires Tomorrow!`
                        : `🔔 Your Omnievents Subscription Expires in ${daysUntilExpiry} Days`;

                    const urgencyColor = daysUntilExpiry === 1 ? '#DC2626' : '#F59E0B';

                    await base44.integrations.Core.SendEmail({
                        to: vendorEmail,
                        subject: subject,
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: ${urgencyColor};">Subscription Expiring Soon</h1>
                                <p>Hi ${vendor.business_name},</p>
                                <p>This is a friendly reminder that your Omnievents subscription will expire in <strong style="color: ${urgencyColor};">${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</strong>.</p>
                                
                                <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
                                    <p><strong>Subscription Plan:</strong> ${vendor.subscription_type}</p>
                                    <p><strong>Expiration Date:</strong> ${endDate}</p>
                                </div>
                                
                                <p>To continue enjoying uninterrupted service and visibility on our platform, please renew your subscription before it expires.</p>
                                
                                <div style="background: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px;"><strong>What happens if my subscription expires?</strong></p>
                                    <ul style="margin: 10px 0; font-size: 14px; color: #64748B;">
                                        <li>Your listing will be hidden from the marketplace</li>
                                        <li>You won't receive new booking requests</li>
                                        <li>Your analytics and messages will be preserved</li>
                                    </ul>
                                </div>
                                
                                <a href="https://eventsrup.com/ManageListing" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Renew Subscription</a>
                                
                                <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
                                    Questions? Contact our support team for assistance.
                                </p>
                            </div>
                        `
                    });

                    notificationsSent++;
                }
            }
        }

        return Response.json({ 
            success: true, 
            notificationsSent,
            message: `Sent ${notificationsSent} subscription expiry notifications`
        });
    } catch (error) {
        console.error('Error checking subscription expiry:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});