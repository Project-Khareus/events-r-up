import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { secrets } from 'base44:runtime';
import { getDiditDecision, linkDecisionToVendor } from '../../shared/didit.js';

// Receives Didit status.updated webhooks so sessions that finish later
// (e.g. "In Review" -> "Approved") update the vendor's Ghana Card status.
// The payload is only used to find the session; the decision is re-fetched from Didit.

function shortenFloats(data) {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, shortenFloats(v)]));
  }
  if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0) return Math.trunc(data);
  return data;
}

function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => { acc[key] = sortKeys(obj[key]); return acc; }, {});
  }
  return obj;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function(req) {
  const webhookSecret = secrets.get('DIDIT_WEBHOOK_SECRET');
  const apiKey = secrets.get('DIDIT_API_KEY');
  if (!webhookSecret || !apiKey) return Response.json({ error: 'Not configured' }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Invalid body' }, { status: 400 });

  const timestamp = req.headers.get('x-timestamp');
  const signature = req.headers.get('x-signature-v2');
  if (!timestamp || Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) > 300) {
    return Response.json({ error: 'Stale request' }, { status: 401 });
  }
  const expected = await hmacHex(webhookSecret, JSON.stringify(sortKeys(shortenFloats(body))));
  if (!safeEqual(expected, signature)) return Response.json({ error: 'Invalid signature' }, { status: 401 });

  if (body.webhook_type !== 'status.updated' || !body.session_id) return Response.json({ received: true });

  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const records = await db.entities.VendorVerification.filter({ didit_session_id: body.session_id }, { limit: 1 });
    const record = records.items?.[0] || records[0];
    if (!record) return Response.json({ received: true, linked: false }); // not attached to a vendor yet

    const decision = await getDiditDecision({ apiKey, sessionId: body.session_id });
    await linkDecisionToVendor(db, { vendorId: record.vendor_id, userId: record.user_id, decision });
    return Response.json({ received: true, linked: true });
  } catch (error) {
    console.error('Didit webhook processing failed:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
