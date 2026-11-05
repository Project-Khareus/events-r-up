import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { postSocialPublicationToSlack } from '../../shared/socialSlack.js';

const FACEBOOK_API = 'https://graph.facebook.com/v25.0';
const INSTAGRAM_API = 'https://graph.instagram.com/v25.0';

async function readResponse(response, fallback) {
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || fallback);
  return data;
}

async function getFacebookPages(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
  const response = await fetch(`${FACEBOOK_API}/me/accounts?fields=id,name,access_token`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000)
  });
  const data = await readResponse(response, 'Unable to load Facebook Pages');
  return data.data || [];
}

function getVendorImages(vendor) {
  return [...new Set([vendor.image_url, vendor.logo_url, vendor.profile_picture_url, ...(vendor.gallery_images || [])]
    .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url)))].slice(0, 10);
}

const CATEGORY_LABELS = {
  event_planner: 'event planning', bridal_fashion: 'bridal fashion & accessories',
  beauty_personal_care: 'beauty & personal care', decor_logistics: 'décor & event setup',
  event_grounds: 'event venues', photography_videography: 'photography & videography',
  design_creatives: 'design & creatives', catering: 'catering', jewellery: 'jewellery',
  honeymoon_packages: 'honeymoon packages', music_karaoke_mc: 'music, DJ & MC services',
  car_rentals: 'car rentals', social_media_support: 'social media coverage', ushers: 'ushering',
  dance_tutorials: 'dance lessons', rent_a_team: 'event staffing', gifts: 'gifts',
  babies_baby_showers: 'baby showers', conference_facilities: 'conference facilities',
  rapporteur_services: 'rapporteur services', caskets: 'caskets', catering_drinks: 'catering & drinks',
  wreaths: 'wreaths', others: 'event services',
};
const EVENT_LABELS = { weddings: 'weddings', parties: 'parties', conference: 'conferences', funeral: 'funerals' };

// A different creative angle each time keeps drafts from sounding the same.
const ANGLES = [
  'Open with a short, vivid scene from the kind of event this vendor serves, then reveal the vendor.',
  'Open with a playful question that people planning these events will recognise.',
  'Open with one bold, confident statement about what makes this vendor worth knowing.',
  'Open with a quick "picture this" moment that puts the reader at their own event.',
  'Open with a warm welcome that celebrates the vendor joining the Khareus family.',
  'Open with a short list-style hook, e.g. two or three things guests will remember, then reveal who makes it happen.',
];

// First-person singular slips ("I", "I'm", "me", "my"...) that the Khareus voice must never use.
const FIRST_PERSON_SINGULAR = /\b(I|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll|me|my|mine|myself)\b/i;

function vendorFacts(vendor) {
  const locations = Array.isArray(vendor.locations) && vendor.locations.length ? vendor.locations : (vendor.location ? [vendor.location] : []);
  return [
    `Business: ${vendor.business_name}`,
    `Slogan: ${vendor.slogan || 'Not provided'}`,
    `Event types: ${(vendor.event_type || []).map((t) => EVENT_LABELS[t] || t).join(', ') || 'Not provided'}`,
    `What they do: ${[].concat(vendor.category || []).map((c) => CATEGORY_LABELS[c] || c).join(', ') || 'Not provided'}`,
    `Locations: ${locations.join(', ') || 'Not provided'}`,
    `Services: ${(vendor.services || []).join(', ') || 'Not provided'}`,
    `Years in business: ${vendor.years_in_business || 'Not provided'}`,
    `Description: ${String(vendor.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Not provided'}`,
  ].join('\n');
}

function buildDraftPrompt(vendor) {
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  return `You write Facebook and Instagram captions for Khareus, Ghana's marketplace for event vendors (weddings, parties, conferences and funerals).

Write ONE caption introducing this approved vendor.

VOICE
- Write as the Khareus team: always "we", "us", "our". Never use "I", "I'm", "me", "my" or "mine".
- Confident, warm and punchy, like a brand people love following. Celebrate the vendor; don't sound like an advert.
- Respectful and gentle in tone if the vendor serves funerals.

SHAPE
- Line 1: a scroll-stopping hook of no more than 10 words. ${angle}
- Then 2 or 3 short lines (one idea per line, blank line between them) that bring in one or two specific details from the facts below.
- Then one clear call to action, such as inviting people planning ${(vendor.event_type || []).map((t) => EVENT_LABELS[t] || t).join(' or ') || 'their next event'} to check out ${vendor.business_name} on Khareus, and a nod that Khareus has many more trusted vendors.
- Last line: 3 or 4 relevant hashtags, mixing the vendor's speciality, the event type and Ghana or the city, ending with #Khareus.
- 45 to 80 words before the hashtags. At most 2 emojis, only where they add something.

RULES
- Use only the facts below. Do not invent awards, prices, availability, experience or services.
- Plain text only: no title, no quotation marks, no markdown, no links.
- Avoid clichés such as "look no further", "elevate", "game-changer", "unforgettable experience" and "say goodbye to".

FACTS
${vendorFacts(vendor)}`;
}

function cleanCopy(text) {
  return String(text || '')
    .replace(/^["“”']+|["“”']+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Keeps captions a sensible length without cutting a sentence or the hashtags in half.
function trimCaption(text, maxWords = 110) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  const lines = text.split('\n');
  const tags = /^#/.test(lines[lines.length - 1].trim()) ? lines.pop() : '';
  let body = lines.join('\n');
  while (body.split(/\s+/).length > maxWords - 8 && /[.!?]/.test(body)) {
    const cut = body.slice(0, -1).search(/[.!?][^.!?]*$/);
    if (cut <= 0) break;
    body = body.slice(0, cut + 1);
  }
  return tags ? `${body.trim()}\n\n${tags.trim()}` : body.trim();
}

async function writeDraft(base44, vendor) {
  let copy = cleanCopy(await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: buildDraftPrompt(vendor) }));
  if (FIRST_PERSON_SINGULAR.test(copy)) {
    // One rewrite pass if the model slipped into the singular voice
    copy = cleanCopy(await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Rewrite this social caption so it speaks as the Khareus team using "we", "us" and "our". Remove every "I", "I'm", "me", "my" and "mine". Keep the meaning, line breaks, emojis and hashtags. Return only the caption.\n\n${copy}`,
    }));
  }
  return trimCaption(copy);
}

async function publishFacebook(page, copy, imageUrls) {
  if (imageUrls.length === 1) {
    const response = await fetch(`${FACEBOOK_API}/${page.id}/photos`, {
      method: 'POST',
      body: new URLSearchParams({ url: imageUrls[0], caption: copy, access_token: page.access_token }),
      signal: AbortSignal.timeout(20000)
    });
    return (await readResponse(response, 'Facebook photo publishing failed')).post_id;
  }

  const uploads = await Promise.all(imageUrls.map(async (url) => {
    const response = await fetch(`${FACEBOOK_API}/${page.id}/photos`, {
      method: 'POST',
      body: new URLSearchParams({ url, published: 'false', access_token: page.access_token }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await readResponse(response, 'Facebook image upload failed');
    return data.id;
  }));

  const body = new URLSearchParams({ message: copy, access_token: page.access_token });
  uploads.forEach((id, index) => body.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: id })));
  const response = await fetch(`${FACEBOOK_API}/${page.id}/feed`, { method: 'POST', body, signal: AbortSignal.timeout(20000) });
  return (await readResponse(response, 'Facebook publishing failed')).id;
}

async function waitForInstagramContainer(containerId, accessToken) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${INSTAGRAM_API}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(10000) });
    const data = await readResponse(response, 'Instagram media processing status could not be checked');
    const status = data.status_code || data.status;
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error('Instagram could not process the selected media');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Instagram is still processing this media. Please try publishing again shortly.');
}

async function publishInstagram(base44, copy, imageUrls) {
  if (!imageUrls.length) throw new Error('Instagram requires at least one selected image');
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
  const profileResponse = await fetch(`${INSTAGRAM_API}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(10000) });
  const profile = await readResponse(profileResponse, 'Unable to load Instagram Business account');

  const createContainer = async (url, carouselItem = false) => {
    const params = new URLSearchParams({ image_url: url, access_token: accessToken });
    if (carouselItem) params.set('is_carousel_item', 'true');
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, { method: 'POST', body: params, signal: AbortSignal.timeout(20000) });
    return (await readResponse(response, 'Instagram media upload failed')).id;
  };

  let containerId;
  if (imageUrls.length === 1) {
    const params = new URLSearchParams({ image_url: imageUrls[0], caption: copy, access_token: accessToken });
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, { method: 'POST', body: params, signal: AbortSignal.timeout(20000) });
    containerId = (await readResponse(response, 'Instagram media upload failed')).id;
  } else {
    const children = await Promise.all(imageUrls.map((url) => createContainer(url, true)));
    await Promise.all(children.map((id) => waitForInstagramContainer(id, accessToken)));
    const response = await fetch(`${INSTAGRAM_API}/${profile.id}/media`, {
      method: 'POST',
      body: new URLSearchParams({ media_type: 'CAROUSEL', children: children.join(','), caption: copy, access_token: accessToken }),
      signal: AbortSignal.timeout(20000)
    });
    containerId = (await readResponse(response, 'Instagram carousel creation failed')).id;
  }

  await waitForInstagramContainer(containerId, accessToken);
  const publishResponse = await fetch(`${INSTAGRAM_API}/${profile.id}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
    signal: AbortSignal.timeout(20000)
  });
  return (await readResponse(publishResponse, 'Instagram publishing failed')).id;
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
      return Response.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(payload.redirectUri)}&scope=user_photos&response_type=code` });
    }

    if (payload.action === 'fetch_photos') {
      const clientId = secrets.get('FACEBOOK_CLIENT_ID');
      const clientSecret = secrets.get('FACEBOOK_CLIENT_SECRET');
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(payload.redirectUri)}&client_secret=${clientSecret}&code=${payload.code}`, { signal: AbortSignal.timeout(10000) });
      const token = await readResponse(tokenResponse, 'Facebook authentication failed');
      const photosResponse = await fetch(`https://graph.facebook.com/v18.0/me/photos?type=uploaded&fields=images,source&access_token=${encodeURIComponent(token.access_token)}&limit=18`, { signal: AbortSignal.timeout(10000) });
      const photos = await readResponse(photosResponse, 'Unable to load photos');
      return Response.json({ images: (photos.data || []).map((photo) => photo.images?.[0]?.source || photo.source).filter(Boolean) });
    }

    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!payload.vendorId) return Response.json({ error: 'A vendor is required' }, { status: 400 });
    const vendor = await base44.asServiceRole.entities.Vendor.get(payload.vendorId);
    if (!vendor || vendor.status !== 'approved') return Response.json({ error: 'Only approved vendors can be announced' }, { status: 400 });

    if (payload.action === 'generate_draft') {
      const images = getVendorImages(vendor);
      const copy = await writeDraft(base44, vendor);
      const announcement = await base44.asServiceRole.entities.SocialAnnouncement.create({ vendor_id: vendor.id, copy, image_urls: images, facebook_status: 'pending', instagram_status: 'pending', status: 'draft' });
      const pages = await getFacebookPages(base44);
      return Response.json({ announcementId: announcement.id, copy: announcement.copy, imageUrls: images, facebookPages: pages.map((page) => ({ id: page.id, name: page.name })) });
    }

    if (payload.action === 'publish') {
      const announcement = await base44.asServiceRole.entities.SocialAnnouncement.get(payload.announcementId);
      if (!announcement || announcement.vendor_id !== vendor.id || !['draft', 'failed', 'partially_published'].includes(announcement.status)) return Response.json({ error: 'This post has already been published' }, { status: 400 });
      const copy = String(payload.copy || '').trim();
      const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls.filter((url) => announcement.image_urls.includes(url)) : [];
      const publishToFacebook = payload.destinations?.facebook === true;
      const publishToInstagram = payload.destinations?.instagram === true;
      // On a retry, channels that already went out are kept as they are, so nothing posts twice
      const facebookDone = announcement.facebook_status === 'published';
      const instagramDone = announcement.instagram_status === 'published';
      const keep = (value) => Promise.resolve({ selected: true, published: true, value, error: null });
      if (!publishToFacebook && !publishToInstagram) return Response.json({ error: 'Choose at least one publishing destination' }, { status: 400 });
      if (!copy) return Response.json({ error: 'Announcement copy is required' }, { status: 400 });
      if (publishToInstagram && !imageUrls.length) return Response.json({ error: 'Instagram requires at least one selected image' }, { status: 400 });

      let page = null;
      if (publishToFacebook && !facebookDone) {
        if (!payload.facebookPageId) return Response.json({ error: 'Choose a Facebook Page' }, { status: 400 });
        const pages = await getFacebookPages(base44);
        page = pages.find((item) => item.id === payload.facebookPageId);
        if (!page) return Response.json({ error: 'Choose one of your connected Facebook Pages' }, { status: 400 });
      }

      const [facebook, instagram] = await Promise.all([
        publishToFacebook && facebookDone ? keep(announcement.facebook_post_id) : publishToFacebook ? publishFacebook(page, copy, imageUrls).then((value) => ({ selected: true, published: true, value, error: null })).catch((error) => ({ selected: true, published: false, value: null, error: error.message || 'Facebook publishing failed' })) : Promise.resolve({ selected: false, published: false, value: null, error: null }),
        publishToInstagram && instagramDone ? keep(announcement.instagram_media_id) : publishToInstagram ? publishInstagram(base44, copy, imageUrls).then((value) => ({ selected: true, published: true, value, error: null })).catch((error) => ({ selected: true, published: false, value: null, error: error.message || 'Instagram publishing failed' })) : Promise.resolve({ selected: false, published: false, value: null, error: null })
      ]);
      const selectedResults = [facebook, instagram].filter((result) => result.selected);
      const successfulCount = selectedResults.filter((result) => result.published).length;
      const status = successfulCount === selectedResults.length ? 'published' : successfulCount ? 'partially_published' : 'failed';
      await base44.asServiceRole.entities.SocialAnnouncement.update(announcement.id, { copy, image_urls: imageUrls, facebook_page_id: page?.id || announcement.facebook_page_id || null, facebook_status: publishToFacebook ? (facebook.published ? 'published' : 'failed') : announcement.facebook_status, instagram_status: publishToInstagram ? (instagram.published ? 'published' : 'failed') : announcement.instagram_status, facebook_post_id: facebook.value || announcement.facebook_post_id || null, instagram_media_id: instagram.value || announcement.instagram_media_id || null, status, error_details: { facebook: facebook.error, instagram: instagram.error } });
      let slackNotified = false;
      if (status !== announcement.status && ['published', 'partially_published'].includes(status)) {
        // A failed Slack post must not undo a successful publish
        try { await postSocialPublicationToSlack(base44, announcement.id); slackNotified = true; }
        catch (error) { console.error('Slack notification failed:', error.message); }
      }
      return Response.json({ facebook, instagram, status, slackNotified });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Social media action failed' }, { status: 500 });
  }
}