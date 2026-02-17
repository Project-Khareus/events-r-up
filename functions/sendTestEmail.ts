import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'annerquaye@gmail.com',
        subject: 'Your Vendor Listing Has Been Approved! 🎉',
        body: `
            <h1>Congratulations! Your Listing is Live</h1>
            <p>Great news! Your vendor listing <strong>Test Business</strong> has been approved and is now visible to thousands of event planners on Khareus.</p>
            <p>You can now:</p>
            <ul>
                <li>Receive booking requests from clients</li>
                <li>Manage your availability calendar</li>
                <li>Respond to inquiries via messages</li>
            </ul>
            <p><a href="https://eventsrup.com/ManageListing" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Manage Your Listing →</a></p>
            <p>Thank you for joining Khareus!</p>
        `
    });

    return Response.json({ success: true, message: 'Test vendor approval email sent to annerquaye@gmail.com' });
});