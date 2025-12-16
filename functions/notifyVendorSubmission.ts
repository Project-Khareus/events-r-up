import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // We use service role to find an admin
        // Try to filter for admin directly to handle pagination/large user bases
        let admins = [];
        try {
             admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        } catch (e) {
             // Fallback if filter not supported on User entity in this environment
             console.log("Filter failed, falling back to list", e);
             const users = await base44.asServiceRole.entities.User.list();
             admins = users.filter(u => u.role === 'admin');
        }

        if (!admins || admins.length === 0) {
            console.log("No admin found to notify.");
            return Response.json({ message: "No admin found" });
        }

        // Notify all admins or just the first one
        const adminEmail = admins[0].email;
        const { business_name, vendor_id, contact_email } = await req.json();

        await base44.integrations.Core.SendEmail({
            to: adminEmail,
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