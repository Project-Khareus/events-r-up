import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // We use service role to find an admin, as the signing-up user might not have permission to list all users
        const users = await base44.asServiceRole.entities.User.list();
        const admin = users.find(u => u.role === 'admin');

        if (!admin) {
            console.log("No admin found to notify.");
            return Response.json({ message: "No admin found" });
        }

        const { business_name, vendor_id, contact_email } = await req.json();

        await base44.integrations.Core.SendEmail({
            to: admin.email,
            subject: `New Vendor Registration: ${business_name}`,
            body: `
                <h1>New Vendor Registration</h1>
                <p>A new vendor has submitted a listing for approval.</p>
                <ul>
                    <li><strong>Business Name:</strong> ${business_name}</li>
                    <li><strong>Contact Email:</strong> ${contact_email}</li>
                    <li><strong>Vendor ID:</strong> ${vendor_id}</li>
                </ul>
                <p>Please log in to the admin dashboard to review and approve this listing.</p>
            `
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Failed to send notification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});