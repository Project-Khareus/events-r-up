import { useEffect } from "react";

const KHAREUS_DEFAULT_DESCRIPTION = "Khareus is Ghana's premier event vendor marketplace. Find and book trusted vendors for weddings, parties, conferences, and more.";

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export default function MetaTags({ 
  title, 
  description, 
  image, 
  url,
  type = "website"
}) {
  useEffect(() => {
    // Strip HTML and use Khareus fallback if empty
    const cleanDescription = stripHtml(description)?.trim() || KHAREUS_DEFAULT_DESCRIPTION;

    // Update page title
    if (title) {
      document.title = `${title} | Khareus`;
    }

    // Helper to set or update meta tag
    const setMetaTag = (property, content, isName = false) => {
      if (!content) return;
      
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Open Graph tags (Facebook, LinkedIn, etc.)
    setMetaTag('og:title', title);
    setMetaTag('og:description', cleanDescription);
    setMetaTag('og:image', image);
    setMetaTag('og:image:secure_url', image);
    setMetaTag('og:image:width', '1200');
    setMetaTag('og:image:height', '630');
    setMetaTag('og:image:alt', title);
    setMetaTag('og:url', url || window.location.href);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Khareus');
    setMetaTag('og:locale', 'en_US');

    // Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMetaTag('twitter:site', '@khareus', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', cleanDescription, true);
    setMetaTag('twitter:image', image, true);
    setMetaTag('twitter:image:alt', title, true);

    // Facebook specific
    if (import.meta.env.VITE_FACEBOOK_APP_ID) {
      setMetaTag('fb:app_id', import.meta.env.VITE_FACEBOOK_APP_ID, true);
    }

    // Standard meta tags
    setMetaTag('description', cleanDescription, true);

    // Cleanup function to remove added tags when component unmounts
    return () => {
      // Optional: Reset to default values or remove tags
      document.title = 'Khareus';
    };
  }, [title, description, image, url, type]);

  return null; // This component doesn't render anything
}