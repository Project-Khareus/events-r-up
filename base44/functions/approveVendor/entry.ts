import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BRAND = 'Khareus';
const SITE_URL = 'https://khareus.com';

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

function button(text, url, color = '#4F46E5') {
    return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">${text}</a>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { vendor_id } = await req.json();

        if (!vendor_id) {
            return Response.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        await base44.asServiceRole.entities.Vendor.update(vendor_id, {
            status: "approved"
        });

        const vendor = await base44.asServiceRole.entities.Vendor.get(vendor_id);

        if (!vendor) {
            return Response.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Email notification is non-blocking — approval must not fail because of email issues
        let emailSent = false;
        try {
            let emailToSend = vendor.contact_email;
            
            if (!emailToSend && vendor.user_id) {
                 const vendorUser = await base44.asServiceRole.entities.User.get(vendor.user_id);
                 emailToSend = vendorUser?.email;
            }

            if (emailToSend) {
                const content = `
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                        Great news! Your vendor listing for <strong>${vendor.business_name}</strong> has been approved and is now live on ${BRAND}.
                    </p>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                        Customers can now discover your services in our marketplace. You can manage your listing, track bookings, and respond to inquiries from your dashboard.
                    </p>
                    ${button('Manage Your Listing', `${SITE_URL}/ManageListing`)}
                `;

                await base44.integrations.Core.SendEmail({
                    to: emailToSend,
                    subject: `Your ${BRAND} Listing is Approved! 🎉`,
                    body: emailTemplate('Congratulations! 🎉', '#10B981', content)
                });
                emailSent = true;
            }
        } catch (emailError) {
            console.error("Email notification failed (non-blocking):", emailError.message);
        }

        return Response.json({ 
            success: true, 
            message: emailSent ? "Vendor approved and notified" : "Vendor approved (email notification could not be sent)",
            emailSent
        });

    } catch (error) {
        console.error("Approval error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});