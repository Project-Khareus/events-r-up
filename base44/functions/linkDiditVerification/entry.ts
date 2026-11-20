import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { secrets } from 'base44:runtime';
import { getDiditDecision, linkDecisionToVendor } from '../../shared/didit.js';

// Attaches a finished (or still pending) Didit session to one of the user's vendor listings.
// The status written comes from Didit's API, never from the browser.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vendor_id: vendorId, session_id: sessionId } = await req.json().catch(() => ({}));
    if (!vendorId || !sessionId) return Response.json({ error: 'vendor_id and session_id are required' }, { status: 400 });

    const apiKey = secrets.get('DIDIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'Ghana Card verification is not configured yet' }, { status: 503 });

    const db = base44.asServiceRole;
    const vendor = await db.entities.Vendor.get(vendorId).catch(() => null);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
    if (vendor.user_id !== user.id && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const decision = await getDiditDecision({ apiKey, sessionId });
    const result = await linkDecisionToVendor(db, { vendorId, userId: vendor.user_id, decision });
    return Response.json({ success: true, ...result });
  } catch (error) {
    const status = /different account/.test(error.message || '') ? 403 : 502;
    return Response.json({ error: error.message || 'Could not link verification' }, { status });
  }
}
