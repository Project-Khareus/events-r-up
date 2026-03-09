import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Image } from "npm:imagescript@1.3.0";

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

    // Resize images to reduce payload size - target max 600px wide
    const resizeAndCompress = async (buf) => {
      const img = await Image.decode(new Uint8Array(buf));
      const maxWidth = 600;
      if (img.width > maxWidth) {
        const ratio = maxWidth / img.width;
        img.resize(maxWidth, Math.round(img.height * ratio));
      }
      return await img.encodeJPEG(60);
    };

    const [frontSmall, backSmall, selfieSmall] = await Promise.all([
      resizeAndCompress(frontBuf),
      resizeAndCompress(backBuf),
      resizeAndCompress(selfieBuf)
    ]);

    console.log("Compressed sizes - Front:", frontSmall.length, "Back:", backSmall.length, "Selfie:", selfieSmall.length);

    // Convert to base64
    const toBase64 = (bytes) => {
      const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      let binary = '';
      for (let i = 0; i < u8.length; i++) {
        binary += String.fromCharCode(u8[i]);
      }
      return btoa(binary);
    };

    const docFront = toBase64(frontSmall);
    const docBack = toBase64(backSmall);
    const selfie = toBase64(selfieSmall);

    const totalB64 = docFront.length + docBack.length + selfie.length;
    console.log("Total base64 payload:", totalB64, "bytes (~" + (totalB64 / 1024).toFixed(0) + " KB)");

    // Call Agregar API
    const apiKey = Deno.env.get("GHANA_CARD_API_KEY");
    const apiSecret = Deno.env.get("GHANA_CARD_API_SECRET");

    console.log("Calling Agregar API...");

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

    const rawText = await apiResponse.text();
    console.log("API status:", apiResponse.status);
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
    
    console.log("Parsed API response:", JSON.stringify(apiResult));

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