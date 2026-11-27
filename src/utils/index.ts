


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
// Placeholder events bulk-imported in April 2026 were saved as created by "anonymous".
// Add this to public event queries to keep them hidden.
export const REAL_EVENTS = { created_by: { $ne: "anonymous" } };

type ListedEvent = { id?: string; title?: string; event_date?: string; location_address?: string; created_date?: string };

const normalize = (text?: string) => (text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

// Drops repeated listings of the same event, keeping the first one created. Two
// listings are the same event when they share a day and a title, or a start time
// and a venue (e.g. the same flyer imported twice under slightly different titles).
// Keeps the order of the input.
export function dropDuplicateEvents<T extends ListedEvent>(events: T[]): T[] {
    const byAge = [...events].sort((a, b) => String(a.created_date || "").localeCompare(String(b.created_date || "")));
    const seen = new Set<string>();
    const keep = new Set<T>();
    for (const event of byAge) {
        const date = String(event.event_date || "");
        const keys = [
            `t|${date.slice(0, 10)}|${normalize(event.title)}`,
            // Only a specific address counts as a venue, not just "Ghana" or "Accra, Ghana"
            ...(normalize(event.location_address).length >= 12 ? [`v|${date.slice(0, 16)}|${normalize(event.location_address)}`] : []),
        ];
        if (keys.some((k) => seen.has(k))) continue;
        keys.forEach((k) => seen.add(k));
        keep.add(event);
    }
    return events.filter((event) => keep.has(event));
}

// Public link for an event: /event/{name-slug} when it has one, otherwise the id link.
export function eventPageUrl(event: { id?: string; slug?: string } | null | undefined) {
    if (event?.slug) return `/event/${encodeURIComponent(event.slug)}`;
    return `${createPageUrl("EventDetail")}?id=${event?.id ?? ""}`;
}
