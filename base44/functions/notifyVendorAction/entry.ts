import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';
import { emailTemplate, button, escapeHtml, SITE_URL } from '../../shared/emailLayout.js';

export default async function (req: Request): Promise<Response> {
  try {
    const { vendorId, action, reason } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allowed = ['rejected', 'suspended', 'changes_approved', 'changes_rejected'];
    if (!allowed.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
    if (!vendor.contact_email) return Response.json({ success: true, emailSent: false });

    const name = escapeHtml(vendor.business_name);
    const actor = escapeHtml(user.full_name || 'Admin');
    const why = escapeHtml(reason || 'No specific reason provided');
    const manageLink = `${SITE_URL}/ManageListing`;
    const messageLink = `${SITE_URL}/Messages?admin=true`;

    let subject = '';
    let title = '';
    let color = '#4F46E5';
    let content = '';

    if (action === 'rejected') {
      subject = 'Your Vendor Listing Was Not Approved';
      title = 'Listing Not Approved';
      color = '#EF4444';
      content = `
        <p>Your vendor listing <strong>${name}</strong> could not be approved at this time.</p>
        <h3>Reason:</h3>
        <p style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">${why}</p>
        <p>Please update your listing and contact admin if you need clarification.</p>
        ${button('Edit Your Listing', manageLink)}
      `;
    } else if (action === 'suspended') {
      subject = 'Your Vendor Listing Has Been Suspended';
      title = 'Listing Suspended';
      color = '#EF4444';
      content = `
        <p>Your vendor listing <strong>${name}</strong> has been suspended and is no longer visible to users.</p>
        <p><strong>Suspended by:</strong> ${actor}</p>
        <h3>Reason:</h3>
        <p style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">${why}</p>
        <p>If you believe this is a mistake or would like to resolve the issues, please contact us:</p>
        ${button('Contact Admin', messageLink)}
      `;
    } else if (action === 'changes_approved') {
      subject = 'Your Vendor Changes Have Been Approved';
      title = 'Changes Approved!';
      content = `
        <p>Great news! Your recent changes to <strong>${name}</strong> have been approved and are now live.</p>
        <p><strong>Approved by:</strong> ${actor}</p>
        ${button('Manage Your Listing', manageLink)}
      `;
    } else {
      subject = 'Vendor Changes Require Revision';
      title = 'Changes Need Revision';
      color = '#D97706';
      content = `
        <p>Your recent changes to <strong>${name}</strong> could not be approved at this time.</p>
        <p><strong>Reviewed by:</strong> ${actor}</p>
        <h3>Reason:</h3>
        <p style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${why}</p>
        <p>Please review and resubmit your changes:</p>
        ${button('Edit Your Listing', manageLink)}
        <p><a href="${messageLink}" style="color: #4F46E5; text-decoration: none;">Message Admin for Clarification →</a></p>
      `;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: vendor.contact_email,
      from_name: 'Khareus',
      subject,
      body: emailTemplate(title, color, content)
    });

    return Response.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('notifyVendorAction failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}