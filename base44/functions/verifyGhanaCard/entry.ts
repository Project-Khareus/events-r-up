import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { secrets } from 'base44:runtime';

const STORAGE_HOSTS = new Set(['qtrypzzcjebvfcihiynt.supabase.co']);

function isTrustedStorageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && STORAGE_HOSTS.has(url.hostname) && url.pathname.startsWith('/storage/v1/object/');
  } catch {
    return false;
  }
}

function isVerified(result) {
  const verification = result?.id_verification || result?.verification || result;
  const status = String(verification?.status || verification?.result || '').toLowerCase();
  return verification?.verified === true || ['verified', 'approved', 'passed', 'success'].includes(status);
}

function isFailed(result) {
  const verification = result?.id_verification || result?.verification || result;
  const status = String(verification?.status || verification?.result || '').toLowerCase();
  return verification?.verified === false || ['failed', 'rejected', 'declined', 'invalid'].includes(status);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { vendor_id: vendorId } = await req.json().catch(() => ({}));
    if (!vendorId) return Response.json({ error: 'vendor_id is required' }, { status: 400 });

    const verificationRecords = await base44.asServiceRole.entities.VendorVerification.filter({ vendor_id: vendorId }, { limit: 1 });
    const verification = verificationRecords.items?.[0] || verificationRecords[0];
    if (!verification) return Response.json({ error: 'No Ghana Card verification record found for this vendor' }, { status: 404 });

    const frontUrl = verification.ghana_card_image_url;
    const backUrl = verification.ghana_card_back_image_url;
    if (!frontUrl || !backUrl) {
      return Response.json({ error: 'Vendor must submit both Ghana Card front and back images before verification' }, { status: 400 });
    }
    if (![frontUrl, backUrl].every(isTrustedStorageUrl)) {
      return Response.json({ error: 'Verification images must be uploaded through Khareus storage' }, { status: 400 });
    }

    const diditApiKey = secrets.get('DIDIT_API_KEY');
    if (!diditApiKey) return Response.json({ error: 'Didit is not configured' }, { status: 503 });

    const [frontResponse, backResponse] = await Promise.all([
      fetch(frontUrl, { signal: AbortSignal.timeout(10000) }),
      fetch(backUrl, { signal: AbortSignal.timeout(10000) })
    ]);
    if (!frontResponse.ok || !backResponse.ok) {
      return Response.json({ error: 'Unable to retrieve the submitted Ghana Card images' }, { status: 502 });
    }

    const [frontImage, backImage] = await Promise.all([frontResponse.blob(), backResponse.blob()]);
    const formData = new FormData();
    formData.append('front_image', frontImage, 'ghana-card-front.jpg');
    formData.append('back_image', backImage, 'ghana-card-back.jpg');
    formData.append('perform_document_liveness', 'true');
    formData.append('save_api_request', 'false');
    formData.append('vendor_data', vendorId);
    formData.append('metadata', JSON.stringify({ flow: 'khareus_vendor_review' }));

    const diditResponse = await fetch('https://verification.didit.me/v3/id-verification/', {
      method: 'POST',
      headers: { 'x-api-key': diditApiKey },
      body: formData,
      signal: AbortSignal.timeout(30000)
    });
    const diditResult = await diditResponse.json().catch(() => null);

    if (!diditResponse.ok) {
      return Response.json({ error: 'Didit could not complete the verification request' }, { status: 502 });
    }

    const verified = isVerified(diditResult);
    const failed = isFailed(diditResult);
    if (!verified && !failed) {
      return Response.json({ error: 'Didit returned an inconclusive verification result. Review the uploaded card and try again.' }, { status: 422 });
    }

    const status = verified ? 'verified' : 'failed';
    const message = verified ? 'Ghana Card verified by Didit.' : 'Didit could not verify this Ghana Card.';
    await Promise.all([
      base44.asServiceRole.entities.VendorVerification.update(verification.id, {
        ghana_card_status: status,
        ghana_card_verification_message: message,
        ghana_card_verified_at: new Date().toISOString()
      }),
      base44.asServiceRole.entities.Vendor.update(vendorId, { ghana_card_status: status })
    ]);

    return Response.json({ success: true, verified, status, message });
  } catch (error) {
    return Response.json({ error: error.message || 'Verification could not be completed' }, { status: 500 });
  }
}