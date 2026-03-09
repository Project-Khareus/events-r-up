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

    console.log("Original sizes (bytes) - Front:", frontBuf.byteLength, "Back:", backBuf.byteLength, "Selfie:", selfieBuf.byteLength);
    console.log("Total raw size:", frontBuf.byteLength + backBuf.byteLength + selfieBuf.byteLength);

    // Convert to base64
    const toBase64 = (buffer) => {
      const bytes = new Uint8Array(buffer);
      const chunks = [];
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(String.fromCharCode(...bytes.slice(i, i + chunkSize)));
      }
      return btoa(chunks.join(''));
    };

    const docFront = toBase64(frontBuf);
    const docBack = toBase64(backBuf);
    const selfie = toBase64(selfieBuf);

    console.log("Base64 sizes - Front:", docFront.length, "Back:", docBack.length, "Selfie:", selfie.length);

    // Call Agregar API
    const apiKey = Deno.env.get("GHANA_CARD_API_KEY");
    const apiSecret = Deno.env.get("GHANA_CARD_API_SECRET");

    console.log("Calling Agregar API via multipart/form-data...");

    // Use multipart form-data with file uploads instead of JSON base64
    const formData = new FormData();
    formData.append("doc_front", new Blob([frontBuf], { type: "image/jpeg" }), "front.jpg");
    formData.append("doc_back", new Blob([backBuf], { type: "image/jpeg" }), "back.jpg");
    formData.append("selfie", new Blob([selfieBuf], { type: "image/jpeg" }), "selfie.jpg");

    const apiResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "X-API-SECRET": apiSecret
      },
      body: formData
    });

    const rawText = await apiResponse.text();
    console.log("Agregar API status:", apiResponse.status);
    console.log("Agregar API response (first 500 chars):", rawText.substring(0, 500));

    // If multipart also fails with 413, try JSON with base64 (images might just be too large)
    if (apiResponse.status === 413) {
      console.log("Multipart failed with 413. Trying JSON with base64...");
      
      const jsonResponse = await fetch("https://api.agregartech.com/identity/document/facial/GH", {
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

      const jsonRaw = await jsonResponse.text();
      console.log("JSON attempt status:", jsonResponse.status);
      console.log("JSON attempt response (first 500):", jsonRaw.substring(0, 500));

      if (jsonResponse.status === 413) {
        return Response.json({
          error: "Images are too large for the Ghana Card verification API. Please ask the vendor to upload smaller/compressed images (under 1MB each).",
          image_sizes: {
            front: `${(frontBuf.byteLength / 1024 / 1024).toFixed(2)} MB`,
            back: `${(backBuf.byteLength / 1024 / 1024).toFixed(2)} MB`,
            selfie: `${(selfieBuf.byteLength / 1024 / 1024).toFixed(2)} MB`
          }
        }, { status: 413 });
      }

      // Parse the JSON response
      let apiResult;
      try {
        apiResult = JSON.parse(jsonRaw);
      } catch {
        return Response.json({
          error: "Ghana Card API returned an unexpected response.",
          api_status: jsonResponse.status,
          api_response_preview: jsonRaw.substring(0, 200)
        }, { status: 502 });
      }

      return handleApiResult(base44, vendor_id, jsonResponse, apiResult);
    }

    let apiResult;
    try {
      apiResult = JSON.parse(rawText);
    } catch {
      console.error("API returned non-JSON response:", rawText.substring(0, 1000));
      return Response.json({
        error: "Ghana Card API returned an unexpected response.",
        api_status: apiResponse.status,
        api_response_preview: rawText.substring(0, 200)
      }, { status: 502 });
    }
    
    return handleApiResult(base44, vendor_id, apiResponse, apiResult);

  } catch (error) {
    console.error("Verification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleApiResult(base44, vendor_id, apiResponse, apiResult) {
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
}