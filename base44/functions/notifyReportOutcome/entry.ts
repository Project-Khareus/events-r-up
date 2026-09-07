import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';
import { emailTemplate, escapeHtml } from '../../shared/emailLayout.js';

export default async function (req: Request): Promise<Response> {
  try {
    const { reportId, outcomeLabel, outcomeDesc, notes } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const report = await base44.asServiceRole.entities.Report.get(reportId);
    if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

    const label = escapeHtml(outcomeLabel);
    const desc = escapeHtml(outcomeDesc);
    const adminNotes = escapeHtml(notes);
    const targetName = escapeHtml(report.target_name);
    let sent = 0;

    if (report.reporter_email) {
      const content = `
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Thank you for your report regarding <strong>${targetName}</strong>. Our team has reviewed it.
        </p>
        <div style="background: #F1F5F9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #1E293B;">Outcome: ${label}</p>
          <p style="margin: 0; color: #475569; font-size: 14px;">${desc}</p>
        </div>
        ${adminNotes ? `<div style="margin: 16px 0;"><p style="font-weight: 600; color: #1E293B; margin: 0 0 4px;">Admin Notes:</p><p style="color: #475569; font-size: 14px; margin: 0;">${adminNotes}</p></div>` : ''}
        <p style="color: #64748B; font-size: 13px;">If you have further concerns, please don't hesitate to reach out.</p>
      `;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: report.reporter_email,
        from_name: 'Khareus',
        subject: `Update on your report for "${report.target_name}"`,
        body: emailTemplate('Report Update', '#1E293B', content)
      });
      sent += 1;
    }

    if (report.target_type === 'vendor') {
      const vendor = await base44.asServiceRole.entities.Vendor.get(report.target_id);
      if (vendor?.contact_email) {
        const content = `
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Your listing <strong>${escapeHtml(vendor.business_name)}</strong> was reviewed following a user report.
          </p>
          <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: 600; color: #1E293B;">Action Taken: ${label}</p>
            <p style="margin: 0; color: #475569; font-size: 14px;">${desc}</p>
          </div>
          ${adminNotes ? `<div style="margin: 16px 0;"><p style="font-weight: 600; color: #1E293B; margin: 0 0 4px;">Admin Notes:</p><p style="color: #475569; font-size: 14px; margin: 0;">${adminNotes}</p></div>` : ''}
        `;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: vendor.contact_email,
          from_name: 'Khareus',
          subject: `Action taken on your listing "${vendor.business_name}"`,
          body: emailTemplate('Listing Review Notice', '#1E293B', content)
        });
        sent += 1;
      }
    }

    return Response.json({ success: true, emailsSent: sent });
  } catch (error) {
    console.error('notifyReportOutcome failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}