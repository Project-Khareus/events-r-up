import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { messageId } = await req.json();

        if (!messageId) {
            return Response.json({ error: 'Message ID required' }, { status: 400 });
        }

        // Fetch message details
        const message = await base44.asServiceRole.entities.Message.get(messageId);
        
        if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        // Fetch conversation details
        const conversation = await base44.asServiceRole.entities.Conversation.get(message.conversation_id);

        if (!conversation) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Determine recipient (not the sender)
        const recipientId = message.sender_type === 'vendor' 
            ? conversation.user_id 
            : conversation.vendor_id;

        // Fetch recipient user details
        const recipient = await base44.asServiceRole.entities.User.get(recipientId);

        if (!recipient || !recipient.email) {
            return Response.json({ error: 'Recipient not found' }, { status: 404 });
        }

        // Truncate message if too long
        const messagePreview = message.content.length > 150 
            ? message.content.substring(0, 150) + '...' 
            : message.content;

        await base44.integrations.Core.SendEmail({
            to: recipient.email,
            subject: `💬 New message from ${message.sender_name}`,
            body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4F46E5;">New Message</h1>
                    <p>Hi ${recipient.full_name},</p>
                    <p>You have a new message from <strong>${message.sender_name}</strong>.</p>
                    
                    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                        <p style="color: #64748B; font-size: 12px; margin-bottom: 10px;">MESSAGE:</p>
                        <p style="margin: 0;">${messagePreview}</p>
                    </div>
                    
                    <p>Reply to continue the conversation.</p>
                    
                    <a href="https://eventsrup.com/Messages?conversation=${conversation.id}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Message</a>
                    
                    <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
                        To stop receiving email notifications for messages, update your preferences in settings.
                    </p>
                </div>
            `
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending message notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});