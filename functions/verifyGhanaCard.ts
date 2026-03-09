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

    // Fetch vendor record
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendor_id });
    const vendor = vendors[0];

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    if (!vendor.ghana_card_image_url) {
      return Response.json({ error: 'Vendor has not submitted Ghana Card image' }, { status: 400 });
    }

    // Fetch the Ghana Card image and convert to base64
    const imageResponse = await fetch(vendor.ghana_card_image_url);
    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch Ghana Card image' }, { status: 500 });
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Build payload — doc_front is the card image, selfie is optional (same image if no separate selfie)
    const payload = {
      doc_front: base64Image,
      doc_back: base64Image,
      selfie: base64Image
    };

    // Call Agregar API
    const apiKey = Deno.env.get("GHANA_CARD_API_KEY");
    const apiSecret = Deno.env.get("GHANA_CARD_API_SECRET");

    const apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-API-SECRET": apiSecret
      },
      body: JSON.stringify(payload)
    });

    const apiResult = await apiResponse.json();
    console.log("Agregar API response:", JSON.stringify(apiResult));

    const isVerified = apiResponse.ok && (apiResult.verified === true || apiResult.status === "verified" || apiResult.success === true);
    const message = apiResult.message || apiResult.detail || (isVerified ? "Ghana Card verified successfully" : "Ghana Card verification failed");

    // Update vendor record
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