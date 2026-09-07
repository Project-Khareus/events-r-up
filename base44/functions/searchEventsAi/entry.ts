import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';

export default async function (req: Request): Promise<Response> {
  try {
    const { query } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const trimmed = String(query || '').trim();
    if (!trimmed) return Response.json({ matched_ids: [] });

    const events = await base44.asServiceRole.entities.EventListing.list('-created_date', 300);
    const eventsForAi = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: (e.description || '').slice(0, 150),
      theme: e.theme,
      location: e.location_address,
      organizer: e.organizer_name,
      date: e.event_date,
      status: e.status
    }));

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a search engine for event listings. Given the user query and list of events, return the IDs of events that match the query. Consider title, description, theme, location, organizer, and date.\n\nUser query: "${trimmed}"\n\nEvents:\n${JSON.stringify(eventsForAi)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          matched_ids: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return Response.json({ matched_ids: result.matched_ids || [] });
  } catch (error) {
    console.error('searchEventsAi failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}