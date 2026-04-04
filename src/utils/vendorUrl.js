/**
 * Generates a clean, SEO-friendly vendor URL slug.
 * Format: /vendor/business-name-shortid
 * 
 * @param {object} vendor - Vendor object with id and business_name
 * @returns {string} Clean URL path like "/vendor/awesome-photography-a1b2c3d4"
 */
export function getVendorUrl(vendor) {
  if (!vendor || !vendor.id) return "/";
  const name = (vendor.business_name || "vendor")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
    .replace(/\s+/g, "-")           // spaces to hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-|-$/g, "")          // trim leading/trailing hyphens
    .substring(0, 60);              // limit length

  const shortId = vendor.id.slice(-8);
  return `/vendor/${name}-${shortId}`;
}

/**
 * Extracts the vendor ID from a slug.
 * The last 8 characters before the end are the short ID suffix.
 * We use this to filter vendors.
 * 
 * @param {string} slug - URL slug like "awesome-photography-a1b2c3d4"
 * @returns {string} The 8-char short ID suffix
 */
export function parseVendorSlug(slug) {
  if (!slug) return null;
  // The short ID is the last 8 characters after the final hyphen
  const lastHyphen = slug.lastIndexOf("-");
  if (lastHyphen === -1 || lastHyphen === slug.length - 1) return slug;
  return slug.substring(lastHyphen + 1);
}