// Allow-list based HTML sanitizer used before any dangerouslySetInnerHTML render.
const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "SPAN", "DIV",
  "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "A", "HR"
]);

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return; // text
      if (child.nodeType !== 1) {
        child.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // keep the readable text, drop the element
        child.replaceWith(...child.childNodes);
        return;
      }
      // strip every attribute except safe links
      [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
      if (child.tagName === "A") {
        child.setAttribute("rel", "noopener noreferrer nofollow");
        child.setAttribute("target", "_blank");
      }
      walk(child);
    });
  };

  walk(root);
  return root.innerHTML;
}