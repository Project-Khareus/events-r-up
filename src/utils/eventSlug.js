import { base44 } from "@/api/base44Client";

// Convert an event title into a URL-friendly slug, e.g.
// "Christmas in St. Michaels, Maryland!" -> "christmas-in-st-michaels-maryland"
export function slugifyEventTitle(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Generate a unique slug for an event title, appending -2, -3... on collisions.
// Pass excludeId when editing so the event's own current slug doesn't conflict.
export async function generateUniqueEventSlug(title, excludeId = null) {
  const base = slugifyEventTitle(title) || "event";
  const candidates = [base];
  for (let n = 2; n <= 20; n++) candidates.push(`${base}-${n}`);

  for (const candidate of candidates) {
    const matches = await base44.entities.EventListing.filter({ slug: candidate });
    const conflicts = (matches || []).filter((e) => e.id !== excludeId);
    if (conflicts.length === 0) return candidate;
  }
  // Extremely unlikely fallback
  return `${base}-${Date.now()}`;
}