import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';
import { emailTemplate, button, escapeHtml, SITE_URL } from '../../shared/emailLayout.js';

export default async function (req: Request): Promise<Response> {
  try {
    const { vendorId, needsGhanaCardUpload } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
    if (vendor.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ghanaCardNote = needsGhanaCardUpload
      ? '<li style="color: #D97706; font-weight: 600;">Ghana Card verification is still pending — please edit your listing to upload it</li>'
      : '<li>Your Ghana Card details have been received for verification</li>';

    const content = `
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi ${escapeHtml(user.full_name || 'there')},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your vendor listing <strong>"${escapeHtml(vendor.business_name)}"</strong> has been submitted and is now pending review by our team.</p>
      ${needsGhanaCardUpload ? `
      <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #F59E0B;">
        <p style="margin: 0; color: #92400E; font-weight: 600; font-size: 14px;">Ghana Card Verification Pending</p>
        <p style="margin: 8px 0 0; color: #92400E; font-size: 13px;">Please edit your listing to add your Ghana Card details and complete verification.</p>
      </div>` : ''}
      <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
        <p style="margin: 4px 0; color: #334155;"><strong>What happens next?</strong></p>
        <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
          <li>Our team will review your listing within 24-48 hours</li>
          ${ghanaCardNote}
          <li>You'll receive an email when your listing is approved</li>
          <li>You can view and edit your listing anytime from your dashboard</li>
        </ul>
      </div>
      ${button('Edit My Listing', `${SITE_URL}/EditVendor?id=${vendor.id}`)}
      <p><a href="${SITE_URL}/ManageListing" style="color: #4F46E5; text-decoration: none;">View My Listings →</a></p>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: 'Khareus',
      subject: needsGhanaCardUpload ? 'Listing Submitted — Ghana Card Verification Needed' : 'Your Vendor Listing Has Been Submitted!',
      body: emailTemplate('Listing Submitted Successfully!', '#4F46E5', content)
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyTrialListingSubmitted failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}