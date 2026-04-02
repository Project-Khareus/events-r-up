import { createClient } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { events } = await req.json().catch(() => ({ events: [] }));

    if (!events || events.length === 0) {
      return Response.json({ error: 'No events provided' }, { status: 400 });
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID'),
      serviceToken: Deno.env.get('BASE44_SERVICE_TOKEN'),
    });

    const results = [];
    for (const event of events) {
      const created = await base44.asServiceRole.entities.EventListing.create(event);
      results.push(created);
    }

    return Response.json({ ok: true, created: results.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});