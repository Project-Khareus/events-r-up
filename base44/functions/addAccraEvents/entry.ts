import { createClientFromRequest } from 'npm:@base44/sdk@0.8.11';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { events } = await req.json().catch(() => ({ events: [] }));

    if (!Array.isArray(events) || events.length === 0) {
      return Response.json({ error: 'No events provided' }, { status: 400 });
    }

    const created = await base44.asServiceRole.entities.EventListing.bulkCreate(events);

    return Response.json({ ok: true, created: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});