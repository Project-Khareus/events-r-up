import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { published_at } = await req.json().catch(() => ({}));
    if (typeof published_at !== 'string' || !Number.isFinite(Date.parse(published_at))) return Response.json({ error: 'A publish time is required' }, { status: 400 });
    const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let count = 0;
    while (true) {
      const page = await base44.asServiceRole.entities.FeatureReleaseNote.filter({ status: 'pending', created_date: { $lte: published_at } }, { sort: 'created_date', limit: 50 });
      if (!page.items.length) break;
      const text = ['*Khareus feature updates*', ...page.items.map(note => `• ${escape(note.description)}`)].join('\n');
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ channel: 'C0CDV21D6JW', text, unfurl_links: false, unfurl_media: false }), signal: AbortSignal.timeout(10000)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(`Slack notification failed: ${result.error || response.status}`);
      await base44.asServiceRole.entities.FeatureReleaseNote.bulkUpdate(page.items.map(note => ({ id: note.id, status: 'sent', published_at })));
      count += page.items.length;
      if (!page.has_more) break;
    }
    return Response.json({ sent: count > 0, count });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to send feature notes' }, { status: 500 });
  }
}