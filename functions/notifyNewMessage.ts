import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
                To stop receiving message notifications, update your preferences in settings.
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
        const { messageId } = await req.json();

        if (!messageId) {
            return Response.json({ error: 'Message ID required' }, { status: 400 });
        }

        const message = await base44.asServiceRole.entities.Message.get(messageId);
        if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        const conversation = await base44.asServiceRole.entities.Conversation.get(message.conversation_id);
        if (!conversation) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const recipientId = message.sender_type === 'vendor' 
            ? conversation.user_id 
            : conversation.vendor_id;

        const recipient = await base44.asServiceRole.entities.User.get(recipientId);

        if (!recipient || !recipient.email) {
            return Response.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const messagePreview = message.content.length > 150 
            ? message.content.substring(0, 150) + '...' 
            : message.content;

        const content = `
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Hi ${recipient.full_name},
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                You have a new message from <strong>${message.sender_name}</strong>.
            </p>
            <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                <p style="color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Message</p>
                <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">${messagePreview}</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Reply to continue the conversation.
            </p>
            ${button('View Message', `${SITE_URL}/Messages?conversation=${conversation.id}`)}
        `;

        await base44.integrations.Core.SendEmail({
            to: recipient.email,
            subject: `💬 New message from ${message.sender_name}`,
            body: emailTemplate('New Message', '#4F46E5', content)
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending message notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});