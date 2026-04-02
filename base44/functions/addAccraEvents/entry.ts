Deno.serve(async (req) => {
  try {
    const { events } = await req.json().catch(() => ({ events: [] }));

    if (!events || events.length === 0) {
      return Response.json({ error: 'No events provided' }, { status: 400 });
    }

    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = Deno.env.get('BASE44_SERVICE_TOKEN');

    // Debug: log what we have
    const tokenPreview = serviceToken ? serviceToken.substring(0, 20) + '...' : 'NOT FOUND';
    
    const url = `https://base44.app/api/apps/${appId}/entities/EventListing`;

    const results = [];
    for (const event of events) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      results.push({ status: res.status, data });
    }

    return Response.json({ ok: true, created: results.length, tokenPreview, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});