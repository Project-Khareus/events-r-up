// Fields a vendor is allowed to change through a pending update.
// Anything else in pending_changes (ids, dates, status, billing, nested pending data) is ignored.
const EDITABLE_FIELDS = [
  "business_name", "slogan", "logo_url", "profile_picture_url", "years_in_business",
  "awards", "certifications", "event_type", "category", "description", "location",
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
  return { ...data, pending_changes: null, has_pending_changes: false };
}