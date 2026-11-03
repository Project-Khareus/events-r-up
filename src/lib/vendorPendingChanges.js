// Vendor edits to an approved listing are saved in `pending_changes` for an
// admin to review. EditVendor stores the whole form there, so this file is the
// single place that decides which fields count, how they compare, and how
// they're labelled. Admin review screens, approval and notifications all use it.

// Fields a vendor is allowed to change through a pending update.
// Anything else in pending_changes (ids, dates, status, billing, verification,
// nested pending data) is ignored and never applied.
export const EDITABLE_FIELDS = [
  "business_name", "slogan", "logo_url", "profile_picture_url", "years_in_business",
  "awards", "certifications", "event_type", "category", "description", "location", "locations",
  "starting_price", "price_currency", "contact_email", "contact_phone", "website",
  "instagram", "facebook", "twitter", "tiktok", "linkedin", "image_url",
  "gallery_images", "gallery_videos", "services",
];

export function buildApprovedChanges(pendingChanges = {}) {
  const data = {};
  EDITABLE_FIELDS.forEach((key) => {
    const value = pendingChanges?.[key];
    if (value === undefined || value === null) return;
    if (key === "contact_email" && value === "") return;
    data[key] = value;
  });
  if (data.starting_price !== undefined && data.starting_price !== "") data.starting_price = Number(data.starting_price);
  if (data.years_in_business !== undefined && data.years_in_business !== "") data.years_in_business = parseInt(data.years_in_business, 10);
  return { ...data, pending_changes: null, has_pending_changes: false };
}

export const EVENT_TYPE_LABELS = {
  weddings: "Weddings", parties: "Parties", conference: "Conference", funeral: "Funeral",
};

export const CATEGORY_LABELS = {
  event_planner: "Event Planner", bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care", decor_logistics: "Décor & Logistics Setup",
  event_grounds: "Event Grounds", photography_videography: "Photography & Videography",
  design_creatives: "Design & Creatives", catering: "Catering", jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon Packages", music_karaoke_mc: "Music / Karaoke / MCs",
  car_rentals: "Car Rentals", social_media_support: "Social Media Support", ushers: "Ushers",
  dance_tutorials: "Dance Tutorials", rent_a_team: "Rent-a-Team",
  babies_baby_showers: "Babies & Baby Showers", gifts: "Gifts",
  conference_facilities: "Conference Facilities", rapporteur_services: "Rapporteur Services",
  caskets: "Caskets", catering_drinks: "Catering & Drinks", wreaths: "Wreaths", others: "Others",
};

// How each field is shown, in display order within its group.
const FIELD_META = {
  business_name: { group: "business", label: "Business name", kind: "text" },
  slogan: { group: "business", label: "Slogan", kind: "text" },
  description: { group: "business", label: "Description", kind: "longtext" },
  years_in_business: { group: "business", label: "Years in business", kind: "number" },
  awards: { group: "business", label: "Awards", kind: "list" },
  certifications: { group: "business", label: "Certifications", kind: "list" },
  event_type: { group: "offer", label: "Event types", kind: "list", labels: EVENT_TYPE_LABELS },
  category: { group: "offer", label: "Categories", kind: "list", labels: CATEGORY_LABELS },
  services: { group: "offer", label: "Services", kind: "list" },
  starting_price: { group: "offer", label: "Starting price", kind: "price" },
  locations: { group: "locations", label: "Locations", kind: "list", ordered: true },
  location: { group: "locations", label: "Location", kind: "text" },
  contact_email: { group: "contact", label: "Email", kind: "text" },
  contact_phone: { group: "contact", label: "Phone", kind: "text" },
  website: { group: "contact", label: "Website", kind: "url" },
  instagram: { group: "contact", label: "Instagram", kind: "url" },
  facebook: { group: "contact", label: "Facebook", kind: "url" },
  twitter: { group: "contact", label: "X (Twitter)", kind: "url" },
  tiktok: { group: "contact", label: "TikTok", kind: "url" },
  linkedin: { group: "contact", label: "LinkedIn", kind: "url" },
  logo_url: { group: "media", label: "Logo", kind: "image" },
  profile_picture_url: { group: "media", label: "Profile picture", kind: "image" },
  image_url: { group: "media", label: "Cover photo", kind: "image" },
  gallery_images: { group: "media", label: "Gallery photos", kind: "gallery" },
  gallery_videos: { group: "media", label: "Gallery videos", kind: "gallery" },
};

export const GROUPS = [
  { id: "business", label: "Business details" },
  { id: "offer", label: "Services & pricing" },
  { id: "locations", label: "Locations" },
  { id: "contact", label: "Contact & social" },
  { id: "media", label: "Photos & videos" },
];

export function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h\d)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value, kind) {
  if (value === undefined || value === null) return null;
  if (kind === "list" || kind === "gallery") {
    const arr = (Array.isArray(value) ? value : [value]).map((v) => String(v ?? "").trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  if (kind === "number" || kind === "price") {
    if (value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  const s = kind === "longtext" ? stripHtml(value) : String(value).trim();
  return s ? s : null;
}

function same(a, b, meta) {
  if (a === null || b === null) return a === b;
  if (meta.kind === "list" || meta.kind === "gallery") {
    if (meta.ordered && a[0] !== b[0]) return false; // the first location is the main one
    const A = new Set(a.map((x) => x.toLowerCase()));
    const B = new Set(b.map((x) => x.toLowerCase()));
    return A.size === B.size && [...A].every((x) => B.has(x));
  }
  return a === b;
}

// The real changes in a vendor's pending update, ready to display.
export function getPendingChanges(vendor) {
  const pending = vendor?.pending_changes;
  if (!vendor?.has_pending_changes || !pending) return [];
  const changes = [];
  const hasLocationList = Array.isArray(pending.locations);

  for (const key of Object.keys(FIELD_META)) {
    if (!(key in pending)) continue;
    if (key === "location" && hasLocationList) continue; // shown through `locations`
    const meta = FIELD_META[key];
    let before = normalize(vendor[key], meta.kind);
    const after = normalize(pending[key], meta.kind);
    if (key === "locations" && before === null && vendor.location) before = [vendor.location];

    if (key === "starting_price") {
      const curBefore = vendor.price_currency || "GHS";
      const curAfter = pending.price_currency || curBefore;
      if (same(before, after, meta) && curBefore === curAfter) continue;
      changes.push({ key, ...meta, before, after, currencyBefore: curBefore, currencyAfter: curAfter });
      continue;
    }
    if (same(before, after, meta)) continue;

    const change = { key, ...meta, before, after };
    if (meta.kind === "list" || meta.kind === "gallery") {
      const lower = (arr) => new Set((arr || []).map((x) => x.toLowerCase()));
      const B = lower(before);
      const A = lower(after);
      change.added = (after || []).filter((x) => !B.has(x.toLowerCase()));
      change.removed = (before || []).filter((x) => !A.has(x.toLowerCase()));
      change.kept = (after || []).filter((x) => B.has(x.toLowerCase()));
      if (meta.ordered && before?.[0] !== after?.[0]) change.newMain = after?.[0] || null;
    }
    changes.push(change);
  }
  // Currency changed without a price change
  if (!changes.some((c) => c.key === "starting_price") && "price_currency" in pending
      && (pending.price_currency || "GHS") !== (vendor.price_currency || "GHS")) {
    const amount = normalize(vendor.starting_price, "price");
    changes.push({ key: "starting_price", ...FIELD_META.starting_price, before: amount, after: normalize(pending.starting_price, "price") ?? amount, currencyBefore: vendor.price_currency || "GHS", currencyAfter: pending.price_currency });
  }
  return changes;
}

export function getNameChangeReasons(vendor) {
  const reasons = vendor?.pending_changes?.name_change_reasons;
  return Array.isArray(reasons) ? reasons.filter(Boolean) : [];
}

// Plain-English list of changed fields for notifications, e.g. ["Business name", "Locations"].
export function summarizePendingChanges(vendor) {
  return getPendingChanges(vendor).map((c) => c.label);
}
