import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const DEFAULT_TITLE = "Khareus - Ghana's Event Vendor Marketplace";
const DEFAULT_DESCRIPTION = "Khareus is Ghana's premier event vendor marketplace. Find and book trusted vendors for weddings, parties, conferences, and more.";

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml({ title, description, image, canonicalUrl, redirectUrl }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Khareus" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />
<script>window.location.replace("${escapeHtml(redirectUrl)}");</script>
</head>
<body><p>Redirecting to the event…</p></body>
</html>`;
}

// Public share endpoint: serves social previews (Facebook, LinkedIn, Twitter)
// with the event's own poster and title, then sends human visitors to the event page.
// Called with ?slug=... (or ?id=... as fallback).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    let slug = url.searchParams.get("slug");
    let id = url.searchParams.get("id");
    if (!slug && !id) {
      try {
        const body = await req.json();
        slug = body?.slug || null;
        id = body?.id || null;
      } catch (e) {
        // no body — GET from a social crawler
      }
    }

    let event = null;
    if (slug) {
      const matches = await base44.asServiceRole.entities.EventListing.filter({ slug });
      event = (matches && matches[0]) || null;
    }
    if (!event && id) {
      event = await base44.asServiceRole.entities.EventListing.get(id).catch(() => null);
    }

    if (!event) {
      const home = `${url.origin}/`;
      return new Response(
        buildHtml({
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          image: "",
          canonicalUrl: url.origin + url.pathname + url.search,
          redirectUrl: home,
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const redirectUrl = event.slug
      ? `${url.origin}/event/${encodeURIComponent(event.slug)}`
      : `${url.origin}/EventDetail?id=${event.id}`;

    const title = `${event.title} | Khareus`;
    const image = event.image_url || "";
    const description = (event.description || `Join us at ${event.title}`).slice(0, 300);

    return new Response(
      buildHtml({ title, description, image, canonicalUrl: url.origin + url.pathname + url.search, redirectUrl }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}