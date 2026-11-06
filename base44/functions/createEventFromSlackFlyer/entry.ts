import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Turns an event flyer uploaded to the #publicevents Slack channel into a draft EventListing
// (status pending: hidden from the public until an admin approves it in Admin → Events).
const CHANNEL_NAME = 'publicevents';
const SITE_URL = 'https://khareus.com';
const MAX_FILES = 4;
const MAX_BYTES = 15 * 1024 * 1024;
const THEMES = ['Music', 'Food & Drink', 'Business', 'Arts & Culture', 'Sports', 'Community', 'Party', 'Education', 'Other'];

const FLYER_SCHEMA = {
  type: 'object',
  properties: {
    is_event_flyer: { type: 'boolean', description: 'True only if the image advertises a specific event' },
    title: { type: 'string' },
    event_date: { type: 'string', description: 'Start date and time as YYYY-MM-DDTHH:MM in Ghana time, or empty if no date is shown' },
    time_shown: { type: 'boolean', description: 'Whether a start time is printed on the flyer' },
    venue: { type: 'string', description: 'Venue name and area/city exactly as printed, e.g. "Accra International Conference Centre, Accra"' },
    organizer: { type: 'string', description: 'Organiser, host or presenting brand, or empty' },
    is_paid: { type: 'boolean' },
    price: { type: 'number', description: 'Lowest ticket price in Ghana cedis (0 if free or not shown)' },
    ticket_details: { type: 'string', description: 'All ticket tiers and prices as printed, or empty' },
    other_details: { type: 'string', description: 'Other useful printed details: performers, speakers, dress code, contacts, how to buy tickets, age limits' },
    theme: { type: 'string', enum: THEMES },
    description: { type: 'string' },
  },
  required: ['is_event_flyer', 'title', 'event_date', 'venue', 'is_paid', 'price', 'theme', 'description'],
};

function slugify(title) {
  return String(title || '').toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'event';
}

async function uniqueSlug(base44, title) {
  const base = slugify(title);
  for (let n = 1; n <= 20; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await base44.asServiceRole.entities.EventListing.filter({ slug: candidate });
    if (!(taken.items || taken).length) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function slackApi(token, method, params, body) {
  const url = `https://slack.com/api/${method}${params ? `?${new URLSearchParams(params)}` : ''}`;
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Slack ${method} failed: ${data.error || response.status}`);
  return data;
}

async function geocode(address) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gh&q=${encodeURIComponent(address)}`, {
      headers: { 'User-Agent': 'Khareus/1.0 (https://khareus.com)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000),
    });
    const [hit] = await response.json();
    return hit ? { location_lat: Number(hit.lat), location_lng: Number(hit.lon) } : {};
  } catch {
    return {};
  }
}

function buildPrompt(today) {
  return `You are reading an event flyer for Khareus, a Ghanaian events platform. Today is ${today} (Ghana time, GMT+0).

Read only what is printed on the flyer. Do not invent anything.
- title: the event name as printed, in normal title case (not all caps).
- event_date: the start date and time as YYYY-MM-DDTHH:MM. If the year is missing, use the next date on or after today. If only a date is shown, use 18:00 and set time_shown to false. Leave empty if no date is shown.
- venue: the venue and city/area. If no city is printed but the venue is clearly in Ghana, add the city if you are certain; otherwise leave it as printed.
- price: the lowest ticket price in Ghana cedis as a number. Free events: is_paid false and price 0. If prices are shown in another currency, put the details in ticket_details and use 0.
- theme: the closest of ${THEMES.join(', ')}.
- description: 60 to 120 words of warm, inviting plain text for the event page, written in the third person. Cover what the event is, who it is for, the headline acts or speakers, and practical details (ticket tiers, dress code, how to get tickets, contacts) that are printed on the flyer. No hashtags, no emojis, no markdown, nothing that is not on the flyer.
- is_event_flyer: false if the image is not an event flyer (e.g. a screenshot, a photo or a logo).`;
}

function toIso(localDateTime) {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(localDateTime || '')) return null;
  const date = new Date(`${localDateTime.length === 10 ? `${localDateTime}T18:00` : localDateTime}:00Z`); // Ghana is GMT+0 all year
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

async function processFlyer(base44, token, user, file, ts) {
  if (!/^image\/(jpeg|png|webp|gif|heic)$/.test(file.mimetype || '')) return { skipped: `${file.name || 'File'} is not an image` };
  if (file.size > MAX_BYTES) return { skipped: `${file.name || 'Image'} is larger than 15 MB` };

  // Already handled (Slack can deliver the same event twice)
  const sourceRef = `slack:${file.id}`;
  const existing = await base44.asServiceRole.entities.EventListing.filter({ source_ref: sourceRef });
  const already = (existing.items || existing)[0];
  if (already) return { event: already, duplicate: true };

  const download = await fetch(file.url_private_download || file.url_private, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
  const type = download.headers.get('content-type') || '';
  if (!download.ok || !type.startsWith('image/')) throw new Error(`Could not download the flyer from Slack (${download.status}). The Slack connection may need the files:read permission.`);
  const blob = new Blob([await download.arrayBuffer()], { type });
  const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([blob], file.name || 'flyer.jpg', { type }) });

  const today = new Date().toISOString().slice(0, 10);
  const info = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: buildPrompt(today), file_urls: [file_url], response_json_schema: FLYER_SCHEMA });

  if (!info?.is_event_flyer) return { skipped: `${file.name || 'The image'} doesn't look like an event flyer` };
  const title = String(info.title || '').trim().slice(0, 150);
  const eventDate = toIso(info.event_date);
  const venue = String(info.venue || '').trim();
  const missing = [!title && 'event name', !eventDate && 'date', !venue && 'venue'].filter(Boolean);
  if (missing.length) return { skipped: `I couldn't read the ${missing.join(', ')} on ${file.name || 'the flyer'}` };

  const sameEvent = await base44.asServiceRole.entities.EventListing.filter({ title, event_date: eventDate });
  const twin = (sameEvent.items || sameEvent)[0];
  if (twin) return { event: twin, duplicate: true };

  const price = info.is_paid && Number(info.price) > 0 ? Math.round(Number(info.price) * 100) / 100 : 0;
  const event = await base44.asServiceRole.entities.EventListing.create({
    title,
    event_date: eventDate,
    location_address: venue,
    organizer_name: String(info.organizer || '').trim(),
    is_paid: price > 0 || !!info.is_paid,
    price,
    theme: THEMES.includes(info.theme) ? info.theme : 'Other',
    description: String(info.description || '').trim(),
    image_url: file_url,
    slug: await uniqueSlug(base44, title),
    status: 'pending',
    user_id: user.id,
    source_ref: sourceRef,
    ...(await geocode(venue)),
  });
  return { event, timeShown: info.time_shown !== false, slackTs: ts };
}

function summary({ event, duplicate, timeShown }) {
  const when = new Date(event.event_date).toLocaleString('en-GB', { timeZone: 'Africa/Accra', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return [
    `${duplicate ? ':information_source: Already on Khareus' : ':memo: Draft event created'}: *<${SITE_URL}/event/${event.slug}|${event.title}>*`,
    `• When: ${when}${timeShown === false ? ' (time not on flyer, set to 6pm)' : ''}`,
    `• Where: ${event.location_address}`,
    `• Price: ${event.is_paid ? (event.price ? `GH₵${event.price}` : 'Paid (price not read)') : 'Free'}`,
    `• Organiser: ${event.organizer_name || 'Not shown'}`,
    duplicate ? '' : `_It's a draft, so only admins can see it. Check the details, fix anything I misread, then approve it in <${SITE_URL}/AdminEvents|Admin → Events> to make it public._`,
  ].filter(Boolean).join('\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { data } = await req.json().catch(() => ({}));
    const event = data?.event;
    if (!event || event.type !== 'message' || event.bot_id || !Array.isArray(event.files) || !event.files.length) return Response.json({ skipped: true, reason: 'Not a file upload' });
    if (!/^[CG][A-Z0-9]+$/.test(event.channel || '') || !/^\d{1,16}\.\d{1,10}$/.test(event.ts || '')) return Response.json({ error: 'Invalid Slack message' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');
    const { channel } = await slackApi(accessToken, 'conversations.info', { channel: event.channel });
    if (channel?.name !== CHANNEL_NAME) return Response.json({ skipped: true, reason: 'Not the public events channel' });

    const lines = [];
    let created = 0;
    for (const file of event.files.slice(0, MAX_FILES)) {
      try {
        const result = await processFlyer(base44, accessToken, user, file, event.ts);
        if (result.event) { lines.push(summary(result)); if (!result.duplicate) created++; }
        else lines.push(`:warning: ${result.skipped}. No event was created; you can add it on ${SITE_URL}/CreateEvent instead.`);
      } catch (error) {
        console.error('Flyer failed:', error.message);
        lines.push(`:x: Something went wrong with ${file.name || 'a flyer'}: ${error.message}`);
      }
    }
    if (event.files.length > MAX_FILES) lines.push(`Only the first ${MAX_FILES} images were read. Post the rest in a new message.`);

    await slackApi(accessToken, 'chat.postMessage', null, { channel: event.channel, thread_ts: event.ts, text: lines.join('\n\n'), unfurl_links: false, unfurl_media: false });
    return Response.json({ created, results: lines.length });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to create event from flyer' }, { status: 500 });
  }
}
