import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SITE_URL = 'https://khareus.com';

function emailTemplate(title, accentColor, content) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 3px; font-weight: 600;">KHAREUS</h1>
      </div>
      <div style="border-left: 4px solid ${accentColor}; margin: 24px; padding: 0 20px;">
        <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 16px 0;">${title}</h2>
        ${content}
      </div>
      <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Khareus. All rights reserved.</p>
      </div>
    </div>
  `;
}

function button(text, url, color = '#4F46E5') {
  return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 12px 0;">${text}</a>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const fourteenDaysDate = new Date(today);
    fourteenDaysDate.setDate(fourteenDaysDate.getDate() + 14);
    const fourteenStr = fourteenDaysDate.toISOString().split('T')[0];

    const sevenDaysDate = new Date(today);
    sevenDaysDate.setDate(sevenDaysDate.getDate() + 7);
    const sevenStr = sevenDaysDate.toISOString().split('T')[0];

    const oneDayDate = new Date(today);
    oneDayDate.setDate(oneDayDate.getDate() + 1);
    const oneStr = oneDayDate.toISOString().split('T')[0];

    // Fetch all approved vendors with subscription end dates
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ status: 'approved' });

    let remindersSent = 0;
    let trialsExpired = 0;

    for (const vendor of vendors) {
      if (!vendor.subscription_end_date) continue;

      const endDate = vendor.subscription_end_date;

      // Get vendor email
      let vendorEmail = vendor.contact_email;
      if (!vendorEmail && vendor.user_id) {
        const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
        vendorEmail = vendorUser?.email;
      }
      if (!vendorEmail) continue;

      // --- EXPIRED TRIAL: unpublish and notify ---
      if (vendor.is_trial && endDate <= todayStr) {
        await base44.asServiceRole.entities.Vendor.update(vendor.id, {
          status: 'suspended',
          suspension_reason: 'Trial period expired. Subscribe to a paid plan to reactivate your listing.'
        });

        // Create in-app notification
        if (vendor.user_id) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: vendor.user_id,
            type: 'system',
            title: 'Trial Expired',
            message: `Your trial for "${vendor.business_name}" has ended. Subscribe to keep your listing active.`,
            link: `ManageListing`,
            is_read: false
          });
        }

        const content = `
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${vendor.business_name},</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your <strong>free trial</strong> has ended and your listing has been <strong>unpublished</strong> from the Khareus marketplace.</p>
          
          <div style="background: #FEF2F2; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <p style="margin: 4px 0; color: #991B1B; font-size: 14px; font-weight: 600;">What this means:</p>
            <ul style="margin: 8px 0; font-size: 14px; color: #7F1D1D; padding-left: 16px;">
              <li>Your listing is no longer visible to customers</li>
              <li>You won't receive new booking requests</li>
              <li>Your reviews, messages & data are preserved</li>
            </ul>
          </div>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Subscribe to a paid plan to instantly reactivate your listing and continue growing your business on Khareus.</p>
          
          ${button('Choose a Plan', `${SITE_URL}/ManageListing`)}
          
          <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Need help? Reply to this email or contact our support team.</p>
        `;

        await base44.integrations.Core.SendEmail({
          to: vendorEmail,
          subject: `⚠️ Your Khareus trial has ended — subscribe to stay listed`,
          body: emailTemplate('Your Trial Has Ended', '#DC2626', content)
        });

        trialsExpired++;
        continue; // Skip reminder checks for this vendor
      }

      // --- UPCOMING EXPIRY REMINDERS ---
      let daysUntilExpiry = null;
      if (endDate === fourteenStr) daysUntilExpiry = 14;
      else if (endDate === sevenStr) daysUntilExpiry = 7;
      else if (endDate === oneStr) daysUntilExpiry = 1;

      if (daysUntilExpiry) {
        const urgencyColor = daysUntilExpiry === 1 ? '#DC2626' : '#F59E0B';
        const planLabel = vendor.is_trial ? 'Free Trial' : (vendor.subscription_type || 'Subscription');

        const content = `
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${vendor.business_name},</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your ${planLabel} will expire in <strong style="color: ${urgencyColor};">${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}</strong>.</p>
          
          <div style="background: #F8FAFC; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
            <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Plan:</strong> ${planLabel}</p>
            <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Expires:</strong> ${endDate}</p>
          </div>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">${vendor.is_trial 
            ? 'Subscribe to a paid plan before your trial ends to keep your listing active and visible to customers.' 
            : 'Renew your subscription to continue enjoying uninterrupted service on Khareus.'}</p>
          
          ${button(vendor.is_trial ? 'Choose a Plan' : 'Renew Subscription', `${SITE_URL}/ManageListing`)}
        `;

        const subject = daysUntilExpiry === 1
          ? `⚠️ Your Khareus ${planLabel.toLowerCase()} expires tomorrow!`
          : `🔔 Your Khareus ${planLabel.toLowerCase()} expires in ${daysUntilExpiry} days`;

        await base44.integrations.Core.SendEmail({
          to: vendorEmail,
          subject,
          body: emailTemplate('Subscription Expiring Soon', urgencyColor, content)
        });

        remindersSent++;
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      trialsExpired,
      message: `Sent ${remindersSent} reminders, expired ${trialsExpired} trials`
    });
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});