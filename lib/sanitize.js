import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(html = "") {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
      "ul", "ol", "li", "h2", "h3", "h4", "a", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["class"],
      p: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}
