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
        missing: { front: !frontUrl, back: !backUrl, selfie: !selfieUrl }
      }, { status: 400 });
    }

    // Fetch all three images
    const [frontRes, backRes, selfieRes] = await Promise.all([
      fetch(frontUrl),
      fetch(backUrl),
      fetch(selfieUrl)
    ]);

    if (!frontRes.ok || !backRes.ok || !selfieRes.ok) {
      return Response.json({ error: 'Failed to fetch one or more images' }, { status: 500 });
    }

    const [frontBuf, backBuf, selfieBuf] = await Promise.all([
      frontRes.arrayBuffer(),
      backRes.arrayBuffer(),
      selfieRes.arrayBuffer()
    ]);

    console.log("Image sizes (bytes) - Front:", frontBuf.byteLength, "Back:", backBuf.byteLength, "Selfie:", selfieBuf.byteLength);

    // Convert to base64
    const toBase64 = (buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const docFront = toBase64(frontBuf);
    const docBack = toBase64(backBuf);
    const selfie = toBase64(selfieBuf);

    console.log("Base64 sizes - Front:", docFront.length, "Back:", docBack.length, "Selfie:", selfie.length);

    const apiKey = Deno.env.get("GHANA_CARD_API_KEY");
    const apiSecret = Deno.env.get("GHANA_CARD_API_SECRET");

    // Try multipart/form-data first (more efficient for file uploads)
    console.log("Attempting multipart/form-data upload...");
    const formData = new FormData();
    formData.append("doc_front", new Blob([frontBuf], { type: "image/jpeg" }), "front.jpg");
    formData.append("doc_back", new Blob([backBuf], { type: "image/jpeg" }), "back.jpg");
    formData.append("selfie", new Blob([selfieBuf], { type: "image/jpeg" }), "selfie.jpg");

    let apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "X-API-SECRET": apiSecret
      },
      body: formData
    });

    console.log("Multipart attempt status:", apiResponse.status);

    // If multipart fails with 413, try JSON with base64
    if (apiResponse.status === 413) {
      console.log("Multipart failed (413). Trying JSON base64...");
      apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
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
      console.log("JSON attempt status:", apiResponse.status);
    }

    // If still 413, try x-www-form-urlencoded
    if (apiResponse.status === 413) {
      console.log("JSON also failed (413). Trying URL-encoded...");
      const params = new URLSearchParams();
      params.append("doc_front", docFront);
      params.append("doc_back", docBack);
      params.append("selfie", selfie);

      apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret
        },
        body: params.toString()
      });
      console.log("URL-encoded attempt status:", apiResponse.status);
    }

    if (apiResponse.status === 413) {
      return Response.json({
        error: "Images are too large for the Ghana Card API. The API server rejects payloads over its size limit. Please contact Agregar support to increase the limit, or have vendors upload smaller images.",
        image_sizes: {
          front: `${(frontBuf.byteLength / 1024).toFixed(0)} KB`,
          back: `${(backBuf.byteLength / 1024).toFixed(0)} KB`,
          selfie: `${(selfieBuf.byteLength / 1024).toFixed(0)} KB`,
          total: `${((frontBuf.byteLength + backBuf.byteLength + selfieBuf.byteLength) / 1024).toFixed(0)} KB`
        }
      }, { status: 413 });
    }

    const rawText = await apiResponse.text();
    console.log("API final status:", apiResponse.status);
    console.log("API response (first 500 chars):", rawText.substring(0, 500));

    let apiResult;
    try {
      apiResult = JSON.parse(rawText);
    } catch {
      console.error("Non-JSON response:", rawText.substring(0, 1000));
      return Response.json({
        error: "Ghana Card API returned an unexpected response.",
        api_status: apiResponse.status,
        api_response_preview: rawText.substring(0, 200)
      }, { status: 502 });
    }
    
    console.log("Parsed response:", JSON.stringify(apiResult));

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
      message,
      api_response: apiResult
    });

  } catch (error) {
    console.error("Verification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});