import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { vendor_id } = await req.json();

        if (!vendor_id) {
            return Response.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // 1. Update the vendor status to approved
        // We use service role to ensure we can update regardless of RLS if needed, though admins usually can.
        await base44.asServiceRole.entities.Vendor.update(vendor_id, {
            status: "approved"
        });

        // 2. Fetch the updated vendor to get email
        const vendor = await base44.asServiceRole.entities.Vendor.get(vendor_id);

        if (!vendor) {
            return Response.json({ error: "Vendor not found" }, { status: 404 });
        }

        // 3. Send email to the vendor
        // Priority: Contact email on listing -> User email (need to fetch user)
        let emailToSend = vendor.contact_email;
        
        if (!emailToSend && vendor.user_id) {
             const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
             emailToSend = vendorUser?.email;
        }

        if (emailToSend) {
            await base44.integrations.Core.SendEmail({
                to: emailToSend,
                subject: "Your Omnievents Listing is Approved! 🎉",
                body: `
                    <h1>Congratulations!</h1>
                    <p>Great news! Your vendor listing for <strong>${vendor.business_name}</strong> has been approved and is now live on Omnievents.</p>
                    <p>You can now view your listing in the marketplace and manage it from your dashboard.</p>
                    <br/>
                    <a href="${Deno.env.get('BASE44_APP_URL')}/ManageListing" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Listing</a>
                `
            });
        }

        return Response.json({ success: true, message: "Vendor approved and notified" });

    } catch (error) {
        console.error("Approval error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});