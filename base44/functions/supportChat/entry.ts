import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const APP_CONTEXT = `You are a helpful support assistant for Khareus, an event vendor marketplace platform based in Ghana. Help only with using Khareus: finding vendors, vendor listings, bookings, messages, reviews, favorites, events, blog, notifications, settings, and vendor administration. Be concise, friendly, and helpful. If you cannot resolve an issue, say: "I'm unable to fully resolve this — would you like me to notify an admin to join this chat?" Do not make up features.`;

const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { message, history = [], notifyAdmin, sessionId } = body;
    const isAuthenticated = await base44.auth.isAuthenticated();
    const user = isAuthenticated ? await base44.auth.me() : null;

    if (notifyAdmin) {
      const number = (secrets.get('SUPPORT_WHATSAPP_NUMBER') || '').replace(/\D/g, '');
      const userName = user ? (user.full_name || user.email) : 'Guest';
      const chatSummary = history.slice(-5).map((item) => `${item.role}: ${String(item.content || '').slice(0, 300)}`).join('\n').slice(0, 1200);
      const whatsappText = `Hello Khareus Support, I need help with my support request.\n\nUser: ${userName}\nSession: ${sessionId || 'N/A'}\n\nRecent chat:\n${chatSummary || 'No chat history available'}`.slice(0, 1800);
      const whatsappUrl = number ? `https://wa.me/${number}?text=${encodeURIComponent(whatsappText)}` : null;
      const admins = (await base44.asServiceRole.entities.User.list()).filter((admin) => admin.role === 'admin');

      await Promise.all(admins.map(async (admin) => {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          type: 'system',
          title: 'Support Chat Escalation',
          message: `A user (${userName}) needs support assistance.${whatsappUrl ? ' Continue the conversation on WhatsApp.' : ''}`,
          link: whatsappUrl || '/Messages',
          is_read: false,
          action_type: 'requested_changes'
        });

        if (admin.email) {
          const whatsappButton = whatsappUrl
            ? `<p><a href="${whatsappUrl}" style="display:inline-block;background:#3B322B;color:#F8F1EB;padding:12px 18px;text-decoration:none;border:1px solid #A97E2E">Continue on WhatsApp</a></p>`
            : '<p>Please check the Messages section to assist this user.</p>';
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            from_name: 'Khareus Support',
            subject: `Support Escalation from ${userName}`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#3B322B"><h2>Support Chat Escalation</h2><p><strong>User:</strong> ${escapeHtml(userName)}</p><p><strong>Session:</strong> ${escapeHtml(sessionId || 'N/A')}</p><h3>Recent chat</h3><div style="background:#F8F1EB;border:1px solid #A97E2E;padding:12px;font-size:14px;white-space:pre-wrap">${escapeHtml(chatSummary || 'No history available')}</div>${whatsappButton}</div>`
          });
        }
      }));

      return Response.json({ escalated: true, whatsappUrl });
    }

    const userContext = user
      ? `The user is logged in. Name: ${user.full_name || 'Unknown'}, email: ${user.email}, role: ${user.role || 'user'}.`
      : 'The user is not logged in.';
    const conversation = [...history.slice(-10), { role: 'user', content: message }]
      .map((item) => `${item.role}: ${item.content}`)
      .join('\n');
    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${APP_CONTEXT}\n\nUSER CONTEXT:\n${userContext}\n\nCONVERSATION:\n${conversation}\n\nRespond as the Khareus support assistant.`
    });

    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}