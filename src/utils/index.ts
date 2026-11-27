


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
// Public link for an event: /event/{name-slug} when it has one, otherwise the id link.
export function eventPageUrl(event: { id?: string; slug?: string } | null | undefined) {
    if (event?.slug) return `/event/${encodeURIComponent(event.slug)}`;
    return `${createPageUrl("EventDetail")}?id=${event?.id ?? ""}`;
}
