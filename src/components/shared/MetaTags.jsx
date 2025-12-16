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

    // Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:image', image);
    setMetaTag('og:url', url || window.location.href);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Omnievents');

    // Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:image', image, true);

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