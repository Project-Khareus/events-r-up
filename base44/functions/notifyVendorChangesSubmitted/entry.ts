import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';
import { emailTemplate, button, escapeHtml, firstAdminEmail, SITE_URL } from '../../shared/emailLayout.js';

export default async function (req: Request): Promise<Response> {
  try {
    const { vendorId, changes, nameChangeReasons } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
    if (vendor.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminEmail = await firstAdminEmail(base44);
    if (!adminEmail) return Response.json({ success: true, emailSent: false });

    const reasons = Array.isArray(nameChangeReasons) ? nameChangeReasons : [];
    const nameChanged = reasons.length > 0;
    const name = escapeHtml(vendor.business_name);
    const changesText = (Array.isArray(changes) ? changes : []).map(escapeHtml).join(', ') || 'various fields';

    const content = `
      <p><strong>${name}</strong> has submitted changes for approval.</p>
      <p><strong>Fields updated:</strong> ${changesText}</p>
      ${nameChanged ? `
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">Business Name Change</h3>
          <p style="margin: 0; color: #78350f;"><strong>Reasons:</strong></p>
          <ul style="margin: 8px 0; color: #78350f;">
            ${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <p>Please log in to the admin dashboard to review and approve these changes.</p>
      ${button('Review Changes', `${SITE_URL}/AdminVendors`)}
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'Khareus',
      subject: nameChanged ? `Vendor Name Change Request: ${vendor.business_name}` : `Vendor Update: ${vendor.business_name}`,
      body: emailTemplate(nameChanged ? 'Vendor Name Change Request' : 'Vendor Update Pending Review', '#4F46E5', content)
    });

    return Response.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('notifyVendorChangesSubmitted failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}