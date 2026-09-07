import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BRAND = 'Khareus';

function emailTemplate(title, titleColor, content) {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="padding: 32px 24px;">
            <h1 style="color: ${titleColor}; font-size: 24px; margin: 0 0 20px 0;">${title}</h1>
            ${content}
        </div>
        <div style="border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0 0 8px 0;">
                &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
            </p>
            <p style="color: #94A3B8; font-size: 11px; margin: 0;">
                You're receiving this because you have an account on ${BRAND}.
            </p>
        </div>
    </div>`;
}

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

        await base44.asServiceRole.entities.Vendor.update(vendor_id, {
            status: "rejected",
            suspension_reason: reason || "Does not meet platform guidelines"
        });

        const vendor = await base44.asServiceRole.entities.Vendor.get(vendor_id);

        if (!vendor) {
            return Response.json({ error: "Vendor not found" }, { status: 404 });
        }

        let emailToSend = vendor.contact_email;
        
        if (!emailToSend && vendor.user_id) {
            const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
            emailToSend = vendorUser?.email;
        }

        if (emailToSend) {
            const content = `
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Thank you for your interest in listing <strong>${vendor.business_name}</strong> on ${BRAND}.
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Unfortunately, we are unable to approve your listing at this time.
                </p>
                <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                    <p style="margin: 0; color: #991B1B; font-size: 14px;"><strong>Reason:</strong> ${reason || "Does not meet platform guidelines"}</p>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    If you have questions or would like to resubmit your application with corrections, please contact our support team.
                </p>
                <p style="color: #64748B; font-size: 14px; margin-top: 24px;">
                    Best regards,<br/>
                    The ${BRAND} Team
                </p>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: emailToSend,
                subject: `Update on Your ${BRAND} Listing Application`,
                body: emailTemplate('Listing Application Update', '#DC2626', content)
            });
        }

        return Response.json({ success: true, message: "Vendor rejected and notified" });

    } catch (error) {
        console.error("Rejection error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});