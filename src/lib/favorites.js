import { base44 } from "@/api/base44Client";

// Saving a vendor or event as a favourite ("My Picks").
// Always checks the server first, so a double tap or slow connection can't
// create duplicate records, and unsaving removes every copy (older duplicates
// would otherwise keep the heart red after it was tapped).

const FIELD = { vendor: "vendor_id", event: "event_id" };

async function myFavoritesFor(type, itemId, userId) {
  const records = await base44.entities.Favorite.filter({ item_type: type, [FIELD[type]]: itemId });
  return (records || []).filter((f) => !userId || f.user_id === userId);
}

export async function setFavorite({ type, itemId, user, favorite }) {
  if (!user) throw new Error("login");
  const existing = await myFavoritesFor(type, itemId, user.id);
  if (favorite) {
    if (existing.length > 0) return { action: "added", record: existing[0] };
    const record = await base44.entities.Favorite.create({ user_id: user.id, [FIELD[type]]: itemId, item_type: type });
    return { action: "added", record };
  }
  await Promise.all(existing.map((f) => base44.entities.Favorite.delete(f.id)));
  return { action: "removed", count: existing.length };
}

// Remove favourites by id (used to tidy up duplicates and unavailable items).
export async function removeFavorites(ids) {
  await Promise.all((ids || []).map((id) => base44.entities.Favorite.delete(id).catch(() => null)));
}
