import formatVendorLocation from "./formatLocation";

export const MAX_VENDOR_LOCATIONS = 10;

// All locations a vendor serves. Vendors created before multi-location
// support only have the single `location` field.
export function getVendorLocations(vendor) {
  if (!vendor) return [];
  const list = Array.isArray(vendor.locations) ? vendor.locations : [];
  const all = list.length ? list : vendor.location ? [vendor.location] : [];
  const seen = new Set();
  return all
    .map((l) => String(l || "").trim())
    .filter((l) => l && !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()));
}

// Short label for cards: "East Legon, Accra +2 more".
export function formatVendorLocationsShort(vendor) {
  const list = getVendorLocations(vendor);
  if (!list.length) return "";
  const first = formatVendorLocation(list[0]);
  return list.length > 1 ? `${first} +${list.length - 1} more` : first;
}

// Full list for the vendor page and admin views.
export function formatVendorLocationsFull(vendor) {
  return getVendorLocations(vendor).map((l) => formatVendorLocation(l));
}

// Fields to save: the list, plus `location` kept as the first entry so
// older screens, emails and filters keep working.
export function locationFields(locations) {
  const list = (locations || []).map((l) => String(l).trim()).filter(Boolean);
  return { locations: list, location: list[0] || "" };
}
