import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Sends the "listing approved" email. The approval itself (status update)
// is done by the admin's page directly, so this function never blocks approval.

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

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { business_name, contact_email, user_id } = await req.json().catch(() => ({}));

    let emailToSend = contact_email;
    if (!emailToSend && user_id) {
      try {
        const vendorUser = await base44.asServiceRole.entities.User.get(user_id);
        emailToSend = vendorUser?.email;
      } catch (e) {
        console.error('Owner lookup failed:', e.message);
      }
    }

    if (!emailToSend) {
      return Response.json({ success: true, emailSent: false });
    }

    const content = `
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Great news! Your vendor listing for <strong>${escapeHtml(business_name)}</strong> has been approved and is now live on ${BRAND}.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Customers can now discover your services in our marketplace. You can manage your listing, track bookings, and respond to inquiries from your dashboard.
      </p>
      ${button('Manage Your Listing', `${SITE_URL}/ManageListing`)}
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: emailToSend,
      subject: `Your ${BRAND} Listing is Approved!`,
      body: emailTemplate('Congratulations!', '#10B981', content)
    });

    return Response.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('Approval email error:', error);
    return Response.json({ success: true, emailSent: false, error: error.message });
  }
}