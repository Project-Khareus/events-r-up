import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { vendor_id } = await req.json();
    if (!vendor_id) {
      return Response.json({ error: 'vendor_id is required' }, { status: 400 });
    }

    // Fetch vendor record using get() by ID
    const vendor = await base44.asServiceRole.entities.Vendor.get(vendor_id);

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const frontUrl = vendor.ghana_card_image_url;
    const backUrl = vendor.ghana_card_back_image_url;
    const selfieUrl = vendor.ghana_card_selfie_url;

    if (!frontUrl || !backUrl || !selfieUrl) {
      return Response.json({ 
        error: 'Vendor must submit card front, card back, and selfie images',
        missing: {
          front: !frontUrl,
          back: !backUrl,
          selfie: !selfieUrl
        }
      }, { status: 400 });
    }

    // Fetch all three images and convert to base64
    const [frontRes, backRes, selfieRes] = await Promise.all([
      fetch(frontUrl),
      fetch(backUrl),
      fetch(selfieUrl)
    ]);

    if (!frontRes.ok || !backRes.ok || !selfieRes.ok) {
      return Response.json({ error: 'Failed to fetch one or more images' }, { status: 500 });
    }

    const toBase64 = async (response) => {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const [docFront, docBack, selfie] = await Promise.all([
      toBase64(frontRes),
      toBase64(backRes),
      toBase64(selfieRes)
    ]);

    // Call Agregar/Autheo API
    const apiKey = Deno.env.get("GHANA_CARD_API_KEY");
    const apiSecret = Deno.env.get("GHANA_CARD_API_SECRET");

    console.log("API Key present:", !!apiKey, "API Secret present:", !!apiSecret);
    console.log("Calling Agregar API with front/back/selfie images...");

    const apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-API-SECRET": apiSecret
      },
      body: JSON.stringify({
        doc_front: docFront,
        doc_back: docBack,
        selfie: selfie
      })
    });

    // Read raw response first to handle non-JSON responses
    const rawText = await apiResponse.text();
    console.log("Agregar API status:", apiResponse.status);
    console.log("Agregar API raw response (first 500 chars):", rawText.substring(0, 500));

    let apiResult;
    try {
      apiResult = JSON.parse(rawText);
    } catch {
      // API returned non-JSON (likely HTML error page)
      console.error("API returned non-JSON response. Full response:", rawText.substring(0, 1000));
      return Response.json({
        error: "Ghana Card API returned an unexpected response. The API endpoint may be incorrect or unavailable.",
        api_status: apiResponse.status,
        api_response_preview: rawText.substring(0, 200)
      }, { status: 502 });
    }
    
    console.log("Agregar API parsed response:", JSON.stringify(apiResult));

    const isVerified = apiResponse.ok && (apiResult.verified === true || apiResult.status === "verified" || apiResult.success === true);
    const message = apiResult.message || apiResult.detail || (isVerified ? "Ghana Card verified successfully" : "Ghana Card verification failed");

    await base44.asServiceRole.entities.Vendor.update(vendor_id, {
      ghana_card_status: isVerified ? 'verified' : 'failed',
      ghana_card_verification_message: message,
      ghana_card_verified_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      verified: isVerified,
      status: isVerified ? 'verified' : 'failed',
      message: message,
      api_response: apiResult
    });

  } catch (error) {
    console.error("Verification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});