// Didit identity verification helpers shared by the vendor Ghana Card functions.
// The browser only ever sees a session URL and our mapped status; every decision
// is re-read from Didit's API with the server-side key before it is trusted.

import { secrets } from 'base44:runtime';

const DIDIT_API = 'https://verification.didit.me/v3';

// Reads a secret, preferring the environment variable (where the Base44 secrets API
// stores values, as the Stripe webhook reads them) over the runtime lookup, and trims
// stray whitespace from pasted values.
export function readSecret(name) {
  let value = null;
  try { value = Deno.env.get(name); } catch { /* env access unavailable */ }
  if (!value) {
    try { value = secrets.get(name); } catch { /* not set */ }
  }
  return value ? String(value).trim() : null;
}

// Didit session status -> our ghana_card_status
export function mapDiditStatus(diditStatus, decision) {
  const status = String(diditStatus || '').toLowerCase();
  const card = (decision?.id_verifications || []).find((check) =>
    check.status === 'Approved' && ['GH', 'GHA'].includes(String(check.issuing_state || '').toUpperCase()) && /^(identity card|id card|national id card)$/i.test(String(check.document_type || ''))
  );
  const liveness = (decision?.liveness_checks || []).some((check) => check.status === 'Approved');
  const faceMatch = (decision?.face_matches || []).some((check) => check.status === 'Approved');
  if (status === 'approved' && card && liveness && faceMatch) return 'verified';
  if (status === 'declined') return 'failed';
  return 'pending'; // Not Started, In Progress, In Review, Abandoned, Expired, Resubmitted...
}

export function statusMessage(diditStatus) {
  switch (String(diditStatus || '').toLowerCase()) {
    case 'approved': return 'Ghana Card and selfie verified by Didit.';
    case 'declined': return 'Didit could not verify this Ghana Card and selfie.';
    case 'in review': return 'Didit is reviewing this Ghana Card. This usually takes a short while.';
    case 'abandoned': return 'Ghana Card verification was started but not finished.';
    case 'expired': return 'The Ghana Card verification session expired before it was finished.';
    case 'not started': return 'Ghana Card verification has not been started yet.';
    default: return 'Ghana Card verification is in progress.';
  }
}

export async function createDiditSession({ apiKey, workflowId, vendorData, metadata }) {
  const response = await fetch(`${DIDIT_API}/session/`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: workflowId, vendor_data: vendorData, metadata }),
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.url) {
    // Safe diagnostics: status plus the non-secret key prefix and length, never the key itself
    console.error('Didit session create failed', response.status, String(apiKey).slice(0, 10), String(apiKey).length);
    const detail = body?.detail || body?.message || body?.error;
    throw new Error(detail ? `Didit could not start verification: ${detail}` : 'Didit could not start verification');
  }
  return body;
}

export async function getDiditDecision({ apiKey, sessionId }) {
  if (!/^[0-9a-f-]{36}$/i.test(String(sessionId || ''))) throw new Error('Invalid verification session');
  const response = await fetch(`${DIDIT_API}/session/${sessionId}/decision/`, {
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error('Could not read the Didit verification result');
  if (!readSecret('DIDIT_WORKFLOW_ID') || body.workflow_id !== readSecret('DIDIT_WORKFLOW_ID')) throw new Error('Unexpected Didit verification workflow');
  return body;
}

function documentNumber(decision) {
  const idCheck = (decision.id_verifications || [])[0] || decision.id_verification;
  return idCheck?.document_number || idCheck?.personal_number || undefined;
}

// Writes the Didit decision onto the vendor's VendorVerification record and the
// Vendor.ghana_card_status mirror. `db` must be a service-role client.
// Callers must already have checked that the vendor belongs to `userId`.
export async function linkDecisionToVendor(db, { vendorId, userId, decision }) {
  if (String(decision.vendor_data) !== String(userId)) {
    throw new Error('This verification session belongs to a different account');
  }
  const status = mapDiditStatus(decision.status, decision);
  const fields = {
    didit_session_id: decision.session_id,
    didit_status: decision.status,
    ghana_card_status: status,
    ghana_card_verification_message: decision.status === 'Approved' && status !== 'verified'
      ? 'The required Ghana Card, selfie and face match could not be confirmed.'
      : statusMessage(decision.status),
    ...(status === 'pending' ? {} : { ghana_card_verified_at: new Date().toISOString() })
  };
  const number = documentNumber(decision);
  if (number) fields.ghana_card_number = number;

  const existing = await db.entities.VendorVerification.filter({ vendor_id: vendorId }, { limit: 1 });
  const record = existing.items?.[0] || existing[0];
  if (record) {
    await db.entities.VendorVerification.update(record.id, fields);
  } else {
    await db.entities.VendorVerification.create({ vendor_id: vendorId, user_id: userId, ...fields });
  }
  await db.entities.Vendor.update(vendorId, { ghana_card_status: status });
  return { status, didit_status: decision.status, message: fields.ghana_card_verification_message };
}