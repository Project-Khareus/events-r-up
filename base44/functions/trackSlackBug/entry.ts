import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { data } = await req.json().catch(() => ({}));
    const event = data?.event;
    if (!event || event.channel !== 'C0CEV8QBEQ7' || event.type !== 'message' || event.subtype || !/^\d{1,16}\.\d{1,10}$/.test(event.ts || '')) return Response.json({ error: 'Invalid Slack message' }, { status: 400 });
    if (typeof event.text !== 'string' || !event.text.trim()) return Response.json({ skipped: true, reason: 'No message text' });
    if (event.text.length > 40000) return Response.json({ error: 'Message too long' }, { status: 400 });
    const existing = await base44.asServiceRole.entities.SlackBug.filter({ slack_channel: event.channel, slack_timestamp: event.ts }, { limit: 1 });
    if (existing.items.length) return Response.json({ skipped: true, reason: 'Already recorded' });
    await base44.asServiceRole.entities.SlackBug.create({ message: event.text, slack_user: event.user || '', slack_timestamp: event.ts, slack_channel: event.channel, slack_team: data.team_id || '', status: 'open' });
    return Response.json({ recorded: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to record Slack message' }, { status: 500 });
  }
}