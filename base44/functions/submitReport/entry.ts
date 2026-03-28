import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_type, target_id, target_name, reasons, details, attachments } = await req.json();

    if (!target_type || !target_id || !reasons || reasons.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the report as the authenticated user
    const report = await base44.entities.Report.create({
      reporter_id: user.id,
      reporter_email: user.email,
      target_type,
      target_id,
      target_name,
      reasons,
      details: details || undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      status: "pending"
    });

    // Use service role to create admin notifications (regular users can't create notifications)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    const notificationPromises = admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_id: admin.id,
        type: 'system',
        title: `New Report: ${target_name}`,
        message: `A ${target_type} has been reported for: ${reasons.slice(0, 2).join(', ')}${reasons.length > 2 ? '...' : ''}`,
        link: `AdminReports?id=${report.id}`,
        action_by: user.full_name || user.email,
      })
    );
    await Promise.all(notificationPromises);

    return Response.json({ success: true, reportId: report.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});