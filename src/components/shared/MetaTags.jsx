import { useEffect } from "react";

export default function MetaTags({ 
  title, 
  description, 
  image, 
  url,
  type = "website"
}) {
  useEffect(() => {
    // Update page title
    if (title) {
      document.title = `${title} | Omnievents`;
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
    setMetaTag('og:description', description);
    setMetaTag('og:image', image);
    setMetaTag('og:image:secure_url', image);
    setMetaTag('og:image:width', '1200');
    setMetaTag('og:image:height', '630');
    setMetaTag('og:image:alt', title);
    setMetaTag('og:url', url || window.location.href);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Omnievents');
    setMetaTag('og:locale', 'en_US');

    // Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMetaTag('twitter:site', '@omnievents', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:image', image, true);
    setMetaTag('twitter:image:alt', title, true);

    // Facebook specific
    setMetaTag('fb:app_id', '123456789', true); // Replace with actual FB App ID if available

    // Standard meta tags
    setMetaTag('description', description, true);

    // Cleanup function to remove added tags when component unmounts
    return () => {
      // Optional: Reset to default values or remove tags
      document.title = 'Omnievents';
    };
  }, [title, description, image, url, type]);

  return null; // This component doesn't render anything
}