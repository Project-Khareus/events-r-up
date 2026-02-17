import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await base44.integrations.Core.SendEmail({
            to: 'annerquaye@gmail.com',
            subject: 'Test Email from Khareus',
            body: `<h2>Hello!</h2><p>This is a test email from the Khareus platform. Everything is working correctly!</p><p>Sent on: ${new Date().toLocaleString()}</p>`
        });

        return Response.json({ success: true, message: 'Test email sent to annerquaye@gmail.com' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});