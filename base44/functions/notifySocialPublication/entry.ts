import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { postSocialPublicationToSlack } from '../../shared/socialSlack.js';

// Manual re-send of a publication notice. Publishing itself posts to Slack from socialMedia.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { announcement_id } = await req.json().catch(() => ({}));
    if (typeof announcement_id !== 'string' || !announcement_id.trim()) return Response.json({ error: 'Announcement ID is required' }, { status: 400 });
    await postSocialPublicationToSlack(base44, announcement_id);
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to notify Slack' }, { status: 500 });
  }
}
