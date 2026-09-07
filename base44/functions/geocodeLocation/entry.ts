import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';

export default async function (req: Request): Promise<Response> {
  try {
    const { query } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const trimmed = String(query || '').trim();
    if (trimmed.length < 3) return Response.json({ locations: [] });

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Khareus/1.0 (https://khareus.com)', 'Accept-Language': 'en' }
    });

    if (!response.ok) return Response.json({ locations: [] });

    const results = await response.json();
    const locations = (results || []).map((item) => ({
      name: (item.display_name || '').split(',')[0],
      formatted_address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon)
    }));

    return Response.json({ locations });
  } catch (error) {
    console.error('geocodeLocation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}