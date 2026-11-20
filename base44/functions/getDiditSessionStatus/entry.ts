import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { readSecret, getDiditDecision, mapDiditStatus, statusMessage } from '../../shared/didit.js';

// Returns the current result of the signed-in user's own Didit session.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { session_id: sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) return Response.json({ error: 'session_id is required' }, { status: 400 });

    const apiKey = readSecret('DIDIT_API_KEY');
    if (!apiKey) return Response.json({ error: 'Ghana Card verification is not configured yet' }, { status: 503 });

    const decision = await getDiditDecision({ apiKey, sessionId });
    if (String(decision.vendor_data) !== String(user.id)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    return Response.json({
      session_id: decision.session_id,
      status: mapDiditStatus(decision.status, decision),
      didit_status: decision.status,
      message: decision.status === 'Approved' && mapDiditStatus(decision.status, decision) !== 'verified'
        ? 'The required Ghana Card, selfie and face match could not be confirmed.'
        : statusMessage(decision.status)
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not check verification' }, { status: 502 });
  }
}