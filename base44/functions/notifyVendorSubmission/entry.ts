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
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
            </p>
        </div>
    </div>`;
}

function button(text, url, color = '#4F46E5') {
    return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">${text}</a>`;
}

Deno.serve(async (req) => {
    try {
        // Read body before creating client (body can only be read once)
        const { business_name, vendor_id, contact_email } = await req.json();
        
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let admins = [];
        try {
             admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        } catch (e) {
             console.log("Filter failed, falling back to list", e);
             const users = await base44.asServiceRole.entities.User.list();
             admins = users.filter(u => u.role === 'admin');
        }

        if (!admins || admins.length === 0) {
            console.log("No admin found to notify.");
            return Response.json({ message: "No admin found" });
        }

        const adminEmail = admins[0].email;

        const content = `
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                A new vendor has submitted a listing for approval.
            </p>
            <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
                <p style="margin: 4px 0; color: #334155;"><strong>Business Name:</strong> ${business_name}</p>
                <p style="margin: 4px 0; color: #334155;"><strong>Contact Email:</strong> ${contact_email}</p>
                <p style="margin: 4px 0; color: #334155;"><strong>Vendor ID:</strong> ${vendor_id}</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Please log in to the admin dashboard to review and approve this listing.
            </p>
            ${button('Review Listing', `${SITE_URL}/AdminVendors`)}
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `New Vendor Registration: ${business_name}`,
            body: emailTemplate('New Vendor Registration', '#4F46E5', content)
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Failed to send notification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});