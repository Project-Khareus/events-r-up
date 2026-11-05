import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CHANNEL_ID = 'C0CDT8F28MC';
const APP_URL = 'https://eventsrup.com';

function escapeSlack(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function vendorUrl(vendor) {
  const name = (vendor.business_name || 'vendor').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
  return `${APP_URL}/vendor/${name}-${vendor.id.slice(-8)}`;
}

function facebookUrl(postId) {
  if (!postId || !/^[0-9_]+$/.test(postId)) return null;
  const parts = postId.split('_');
  return parts.length === 2 ? `https://www.facebook.com/${parts[0]}/posts/${parts[1]}` : `https://www.facebook.com/${postId}`;
}

async function instagramUrl(base44, mediaId) {
  if (!mediaId || !/^\d+$/.test(mediaId)) return null;
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
  const params = new URLSearchParams({ fields: 'permalink', access_token: accessToken });
  const response = await fetch(`https://graph.instagram.com/v25.0/${mediaId}?${params}`, { signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  if (!response.ok || data.error || !/^https:\/\/(www\.)?instagram\.com\//.test(data.permalink || '')) return null;
  return data.permalink;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { announcement_id } = await req.json().catch(() => ({}));
    if (typeof announcement_id !== 'string' || !announcement_id.trim()) return Response.json({ error: 'Announcement ID is required' }, { status: 400 });
    const announcement = await base44.asServiceRole.entities.SocialAnnouncement.get(announcement_id).catch((error) => error.status === 404 ? null : Promise.reject(error));
    if (!announcement) return Response.json({ error: 'Announcement not found' }, { status: 404 });
    if (!['published', 'partially_published'].includes(announcement.status)) return Response.json({ error: 'Announcement has not been published' }, { status: 400 });
    const vendor = await base44.asServiceRole.entities.Vendor.get(announcement.vendor_id).catch((error) => error.status === 404 ? null : Promise.reject(error));
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });

    let instagramLink = null;
    if (announcement.instagram_status === 'published') {
      try { instagramLink = await instagramUrl(base44, announcement.instagram_media_id); }
      catch (error) { console.warn('Instagram post link unavailable:', error.message); }
    }
    const facebookLink = announcement.facebook_status === 'published' ? facebookUrl(announcement.facebook_post_id) : null;
    const lines = [
      '*Vendor social publication*',
      `Vendor: <${vendorUrl(vendor)}|${escapeSlack(vendor.business_name)}>`,
      `Overall status: ${announcement.status === 'published' ? 'Published' : 'Partially published'}`,
    ];
    for (const [label, status, link] of [['Facebook', announcement.facebook_status, facebookLink], ['Instagram', announcement.instagram_status, instagramLink]]) {
      if (status === 'published') lines.push(`${label}: Published${link ? ` — <${link}|View post>` : ' — post link unavailable'}`);
      else if (status === 'failed') lines.push(`${label}: Failed`);
    }
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel: CHANNEL_ID, text: lines.join('\n'), unfurl_links: false, unfurl_media: false }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(`Slack notification failed: ${result.error || response.status}`);
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to notify Slack' }, { status: 500 });
  }
}