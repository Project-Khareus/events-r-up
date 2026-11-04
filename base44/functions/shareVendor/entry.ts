import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public share endpoint for vendor pages. Social apps (WhatsApp, Facebook, X,
// LinkedIn, iMessage...) don't run the site's JavaScript, so they only see the
// generic "Vendor Detail | Khareus" tags. This serves the vendor's own name,
// description and photo in the HTML, then sends people on to the vendor page.
// Called with ?id=<vendor id> (or ?v=<last 8 characters of the id>).

const DEFAULT_TITLE = "Khareus - Ghana's Event Vendor Marketplace";
const DEFAULT_DESCRIPTION = "Find and book trusted vendors for weddings, parties, conferences and funerals across Ghana.";
const DEFAULT_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69224d81efa2f499554b5019/7f8180ec6_khareus.png";

const CATEGORY_LABELS: Record<string, string> = {
  event_planner: "Event Planner", bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care", decor_logistics: "Décor & Logistics",
  event_grounds: "Event Grounds", photography_videography: "Photography & Videography",
  design_creatives: "Design & Creatives", catering: "Catering", jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon Packages", music_karaoke_mc: "Music / Karaoke / MC",
  car_rentals: "Car Rentals", social_media_support: "Social Media Support", ushers: "Ushers",
  dance_tutorials: "Dance Tutorials", rent_a_team: "Rent-a-Team", gifts: "Gifts",
  babies_baby_showers: "Babies & Baby Showers", conference_facilities: "Conference Facilities",
  rapporteur_services: "Rapporteur Services", caskets: "Caskets",
  catering_drinks: "Catering & Drinks", wreaths: "Wreaths", others: "Event Services",
};

const CURRENCY_SYMBOLS: Record<string, string> = { GHS: "GH₵", USD: "$", GBP: "£", EUR: "€", NGN: "₦", KES: "KSh", ZAR: "R", CAD: "CA$" };

function escapeHtml(str: unknown) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(str: unknown) {
  return String(str ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

// Same format as src/utils/vendorUrl.js getVendorUrl
function vendorPath(vendor: { id: string; business_name?: string }) {
  const name = (vendor.business_name || "vendor")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
  return `/vendor/${name}-${vendor.id.slice(-8)}`;
}

function isHttpsUrl(value: unknown) {
  return typeof value === "string" && /^https:\/\/[^\s"'<>]+$/i.test(value);
}

function buildHtml({ title, description, image, canonicalUrl, redirectUrl }: Record<string, string>) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="Khareus" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body><p>Opening <a href="${escapeHtml(redirectUrl)}">${escapeHtml(title)}</a>…</p></body>
</html>`;
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Let link-preview crawlers cache the card, but not for long, so edits show up
      "Cache-Control": "public, max-age=600",
    },
  });
}

export default async function (req: Request) {
  const url = new URL(req.url);
  const home = `${url.origin}/`;
  try {
    const base44 = createClientFromRequest(req);
    const id = url.searchParams.get("id");
    const shortId = (url.searchParams.get("v") || "").toLowerCase();

    let vendor = null;
    if (id && /^[a-z0-9]{6,40}$/i.test(id)) {
      vendor = await base44.asServiceRole.entities.Vendor.get(id).catch(() => null);
    }
    if (!vendor && /^[a-z0-9]{6,12}$/.test(shortId)) {
      const all = await base44.asServiceRole.entities.Vendor.filter({ status: "approved" }, "-created_date", 2000).catch(() => []);
      vendor = (all || []).find((v: { id: string }) => v.id.toLowerCase().endsWith(shortId)) || null;
    }

    // Only approved listings get a preview; anything else falls back to the home page
    if (!vendor || vendor.status !== "approved") {
      return html(buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, image: DEFAULT_IMAGE, canonicalUrl: home, redirectUrl: home }));
    }

    const pageUrl = `${url.origin}${vendorPath(vendor)}`;
    const category = (vendor.category || []).map((c: string) => CATEGORY_LABELS[c] || c)[0];
    const locations = Array.isArray(vendor.locations) && vendor.locations.length ? vendor.locations : (vendor.location ? [vendor.location] : []);
    const place = locations.length > 1 ? `${locations[0]} +${locations.length - 1} more` : (locations[0] || "Ghana");

    const title = category ? `${vendor.business_name} · ${category} in ${place}` : `${vendor.business_name} | Khareus`;

    const bits: string[] = [];
    if (vendor.slogan) bits.push(stripHtml(vendor.slogan));
    if (vendor.starting_price) {
      const sym = CURRENCY_SYMBOLS[vendor.price_currency || "GHS"] || `${vendor.price_currency} `;
      bits.push(`From ${sym}${Number(vendor.starting_price).toLocaleString("en-GH")}`);
    }
    if (vendor.rating) bits.push(`★ ${Number(vendor.rating).toFixed(1)}`);
    const intro = bits.join(" · ");
    const about = stripHtml(vendor.description);
    const description = truncate([intro, about].filter(Boolean).join(". ") || `Book ${vendor.business_name} on Khareus.`, 200);

    const image = [vendor.image_url, ...(vendor.gallery_images || []), vendor.profile_picture_url, vendor.logo_url]
      .find(isHttpsUrl) || DEFAULT_IMAGE;

    return html(buildHtml({ title, description, image, canonicalUrl: pageUrl, redirectUrl: pageUrl }));
  } catch (_error) {
    // Never show an error page to someone opening a shared link
    return html(buildHtml({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, image: DEFAULT_IMAGE, canonicalUrl: home, redirectUrl: home }));
  }
}
