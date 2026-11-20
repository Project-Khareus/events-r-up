import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { readSecret, createDiditSession } from '../../shared/didit.js';

// Starts a Didit hosted verification (Ghana Card + selfie) for the signed-in user.
// The session is tied to the user through vendor_data, so only they can link it later.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = readSecret('DIDIT_API_KEY');
    const workflowId = readSecret('DIDIT_WORKFLOW_ID');
    if (!apiKey || !workflowId) return Response.json({ error: 'Ghana Card verification is not configured yet' }, { status: 503 });

    const session = await createDiditSession({
      apiKey,
      workflowId,
      vendorData: user.id,
      metadata: { purpose: 'vendor_ghana_card' }
    });
    return Response.json({ session_id: session.session_id, url: session.url });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not start verification' }, { status: 502 });
  }
}
