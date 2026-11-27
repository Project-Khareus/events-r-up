


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
// Placeholder events bulk-imported in April 2026 were saved as created by "anonymous".
// Add this to public event queries to keep them hidden.
export const REAL_EVENTS = { created_by: { $ne: "anonymous" } };

// Public link for an event: /event/{name-slug} when it has one, otherwise the id link.
export function eventPageUrl(event: { id?: string; slug?: string } | null | undefined) {
    if (event?.slug) return `/event/${encodeURIComponent(event.slug)}`;
    return `${createPageUrl("EventDetail")}?id=${event?.id ?? ""}`;
}
