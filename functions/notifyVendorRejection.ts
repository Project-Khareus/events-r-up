import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { vendor_id, reason } = await req.json();

        if (!vendor_id) {
            return Response.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Update vendor status to rejected
        await base44.asServiceRole.entities.Vendor.update(vendor_id, {
            status: "rejected",
            suspension_reason: reason || "Does not meet platform guidelines"
        });

        // Fetch vendor details
        const vendor = await base44.asServiceRole.entities.Vendor.get(vendor_id);

        if (!vendor) {
            return Response.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Get vendor email
        let emailToSend = vendor.contact_email;
        
        if (!emailToSend && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            emailToSend = vendorUser?.email;
        }

        if (emailToSend) {
            await base44.integrations.Core.SendEmail({
                to: emailToSend,
                subject: "Update on Your Omnievents Listing Application",
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #DC2626;">Listing Application Update</h1>
                        <p>Thank you for your interest in listing <strong>${vendor.business_name}</strong> on Omnievents.</p>
                        <p>Unfortunately, we are unable to approve your listing at this time.</p>
                        
                        <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Reason:</strong> ${reason || "Does not meet platform guidelines"}</p>
                        </div>
                        
                        <p>If you have questions or would like to resubmit your application with corrections, please contact our support team.</p>
                        
                        <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
                            Best regards,<br/>
                            The Omnievents Team
                        </p>
                    </div>
                `
            });
        }

        return Response.json({ success: true, message: "Vendor rejected and notified" });

    } catch (error) {
        console.error("Rejection error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});