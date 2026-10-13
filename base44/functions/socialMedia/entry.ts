import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const FACEBOOK_API = 'https://graph.facebook.com/v25.0';
const INSTAGRAM_API = 'https://graph.instagram.com/v25.0';

async function getFacebookPages(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
  const response = await fetch(`${FACEBOOK_API}/me/accounts?fields=id,name,access_token`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000)
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || 'Unable to load Facebook Pages');
  return data.data || [];
}

function getVendorImages(vendor) {
  return [...new Set([vendor.image_url, vendor.logo_url, vendor.profile_picture_url, ...(vendor.gallery_images || [])]
    .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url)))].slice(0, 10);
}

function limitWords(value, maxWords) {
  return String(value).trim().split(/\s+/).slice(0, maxWords).join(' ');
}

async function publishFacebook(page, copy, imageUrls) {
  const postBody = new URLSearchParams({ message: copy, access_token: page.access_token });
  if (imageUrls.length) {
    const uploads = await Promise.all(imageUrls.map(async (url) => {
      const response = await fetch(`${FACEBOOK_API}/${page.id}/photos`, {
        method: 'POST',
        body: new URLSearchParams({ url, published: 'false', access_token: page.access_token }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || 'Facebook image upload failed');
      return { media_fbid: data.id };
    }));
    postBody.set('attached_media', JSON.stringify(uploads));
  }
  const response = await fetch(`${FACEBOOK_API}/${page.id}/feed`, { method: 'POST', body: postBody, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || 'Facebook publishing failed');
  return data.id;
}

async function publishInstagram(base44, copy, imageUrls) {
  if (!imageUrls.length) throw new Error('Instagram requires at least one selected image');
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
  const profileResponse = await fetch(`${INSTAGRAM_API}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(10000) });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || profile.error) throw new Error(profile.error?.message || 'Unable to load Instagram Business account');

  const createContainer = async (url, carouselItem = false) => {
    const params = new URLSearchParams({ image_url: url, access_token: accessToken });
    if (carouselItem) params.set('is_carousel_item', 'true');
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, { method: 'POST', body: params, signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'Instagram media upload failed');
    return data.id;
  };

  let containerId;
  if (imageUrls.length === 1) {
    const params = new URLSearchParams({ image_url: imageUrls[0], caption: copy, access_token: accessToken });
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, { method: 'POST', body: params, signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'Instagram media upload failed');
    containerId = data.id;
  } else {
    const children = await Promise.all(imageUrls.map((url) => createContainer(url, true)));
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, {
      method: 'POST',
      body: new URLSearchParams({ media_type: 'CAROUSEL', children: children.join(','), caption: copy, access_token: accessToken }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'Instagram carousel creation failed');
    containerId = data.id;
  }

  const publishResponse = await fetch(`${INSTAGRAM_API}/${profile.id}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
    signal: AbortSignal.timeout(20000)
  });
  const published = await publishResponse.json();
  if (!publishResponse.ok || published.error) throw new Error(published.error?.message || 'Instagram publishing failed');
  return published.id;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json().catch(() => ({}));

    if (payload.action === 'get_auth_url') {
      const clientId = secrets.get('FACEBOOK_CLIENT_ID');
      if (!clientId || !payload.redirectUri) return Response.json({ error: 'Facebook setup is incomplete' }, { status: 400 });
      const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(payload.redirectUri)}&scope=user_photos&response_type=code`;
      return Response.json({ url });
    }

    if (payload.action === 'fetch_photos') {
      const clientId = secrets.get('FACEBOOK_CLIENT_ID');
      const clientSecret = secrets.get('FACEBOOK_CLIENT_SECRET');
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(payload.redirectUri)}&client_secret=${clientSecret}&code=${payload.code}`, { signal: AbortSignal.timeout(10000) });
      const token = await tokenResponse.json();
      if (!tokenResponse.ok || token.error) return Response.json({ error: token.error?.message || 'Facebook authentication failed' }, { status: 400 });
      const photosResponse = await fetch(`https://graph.facebook.com/v18.0/me/photos?type=uploaded&fields=images,source&access_token=${encodeURIComponent(token.access_token)}&limit=18`, { signal: AbortSignal.timeout(10000) });
      const photos = await photosResponse.json();
      if (!photosResponse.ok || photos.error) return Response.json({ error: photos.error?.message || 'Unable to load photos' }, { status: 400 });
      return Response.json({ images: (photos.data || []).map((photo) => photo.images?.[0]?.source || photo.source).filter(Boolean) });
    }

    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!payload.vendorId) return Response.json({ error: 'A vendor is required' }, { status: 400 });
    const vendor = await base44.asServiceRole.entities.Vendor.get(payload.vendorId);
    if (!vendor || vendor.status !== 'approved') return Response.json({ error: 'Only approved vendors can be announced' }, { status: 400 });

    if (payload.action === 'generate_draft') {
      const images = getVendorImages(vendor);
      const prompt = `Write one concise social announcement for Khareus introducing this approved event vendor. The voice should feel lively, warm, upbeat, and conversational, with a little tasteful flair. Make it sound like a real person excited to recommend a great find, not a corporate advert. Open with an engaging hook, weave in one or two specific details from the listing, and end with a natural invitation to discover the vendor. A light turn of phrase is welcome when it fits, but avoid forced jokes, slang, clichés, and generic hype. Use only supplied facts. Highlight a distinctive value proposition only when directly supported by the listing. Do not invent awards, availability, pricing, claims, or services. Use no more than 70 words, no hashtags, no title, and no quotation marks.\n\nBusiness: ${vendor.business_name}\nSlogan: ${vendor.slogan || 'Not provided'}\nEvent types: ${(vendor.event_type || []).join(', ') || 'Not provided'}\nCategories: ${(vendor.category || []).join(', ') || 'Not provided'}\nLocation: ${vendor.location || 'Not provided'}\nServices: ${(vendor.services || []).join(', ') || 'Not provided'}\nDescription: ${(vendor.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Not provided'}`;
      const copy = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      const announcement = await base44.asServiceRole.entities.SocialAnnouncement.create({
        vendor_id: vendor.id,
        copy: limitWords(copy, 70),
        image_urls: images,
        facebook_status: 'pending',
        instagram_status: 'pending',
        status: 'draft'
      });
      const pages = await getFacebookPages(base44);
      return Response.json({ announcementId: announcement.id, copy: announcement.copy, imageUrls: images, facebookPages: pages.map((page) => ({ id: page.id, name: page.name })) });
    }

    if (payload.action === 'publish') {
      const announcement = await base44.asServiceRole.entities.SocialAnnouncement.get(payload.announcementId);
      if (!announcement || announcement.vendor_id !== vendor.id || announcement.status !== 'draft') return Response.json({ error: 'This draft is no longer available to publish' }, { status: 400 });
      const copy = String(payload.copy || '').trim();
      const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls.filter((url) => announcement.image_urls.includes(url)) : [];
      if (!copy || !imageUrls.length || !payload.facebookPageId) return Response.json({ error: 'Copy, at least one picture, and a Facebook Page are required' }, { status: 400 });
      const pages = await getFacebookPages(base44);
      const page = pages.find((item) => item.id === payload.facebookPageId);
      if (!page) return Response.json({ error: 'Choose one of your connected Facebook Pages' }, { status: 400 });

      const [facebook, instagram] = await Promise.allSettled([publishFacebook(page, copy, imageUrls), publishInstagram(base44, copy, imageUrls)]);
      const facebookPublished = facebook.status === 'fulfilled';
      const instagramPublished = instagram.status === 'fulfilled';
      const status = facebookPublished && instagramPublished ? 'published' : facebookPublished || instagramPublished ? 'partially_published' : 'failed';
      await base44.asServiceRole.entities.SocialAnnouncement.update(announcement.id, {
        copy,
        image_urls: imageUrls,
        facebook_page_id: page.id,
        facebook_status: facebookPublished ? 'published' : 'failed',
        instagram_status: instagramPublished ? 'published' : 'failed',
        facebook_post_id: facebookPublished ? facebook.value : null,
        instagram_media_id: instagramPublished ? instagram.value : null,
        status,
        error_details: {
          facebook: facebookPublished ? null : facebook.reason?.message || 'Facebook publishing failed',
          instagram: instagramPublished ? null : instagram.reason?.message || 'Instagram publishing failed'
        }
      });
      return Response.json({
        facebook: { published: facebookPublished, error: facebookPublished ? null : facebook.reason?.message || 'Facebook publishing failed' },
        instagram: { published: instagramPublished, error: instagramPublished ? null : instagram.reason?.message || 'Instagram publishing failed' },
        status
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Social media action failed' }, { status: 500 });
  }
}