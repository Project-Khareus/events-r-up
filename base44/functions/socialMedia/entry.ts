import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            });
        }

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, code, redirectUri } = await req.json();
        const clientId = Deno.env.get("FACEBOOK_CLIENT_ID");
        const clientSecret = Deno.env.get("FACEBOOK_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            return Response.json({ error: "Facebook secrets not configured" }, { status: 500 });
        }

        if (action === 'get_auth_url') {
            const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_photos&response_type=code`;
            return Response.json({ url });
        }

        if (action === 'fetch_photos') {
            // Exchange code for access token
            const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
            const tokenRes = await fetch(tokenUrl).then(r => r.json());
            
            if (tokenRes.error) {
                console.error("FB Token Error:", tokenRes.error);
                return Response.json({ error: tokenRes.error.message }, { status: 400 });
            }

            const accessToken = tokenRes.access_token;

            // Fetch photos
            // requesting 'images' field gives an array of sizes, we want the largest
            const photosUrl = `https://graph.facebook.com/v18.0/me/photos?type=uploaded&fields=images,source&access_token=${accessToken}&limit=18`;
            const photosRes = await fetch(photosUrl).then(r => r.json());
            
            if (photosRes.error) {
                console.error("FB Photos Error:", photosRes.error);
                return Response.json({ error: photosRes.error.message }, { status: 400 });
            }

            const images = photosRes.data?.map(p => {
                // Get the largest image
                return p.images?.[0]?.source || p.source;
            }).filter(Boolean) || [];

            return Response.json({ images });
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Social Media Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});