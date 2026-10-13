import sanitizeHtml from "sanitize-html";

const SAFE_STYLE_VALUE =
  /^(?!.*(?:url\s*\(|expression\s*\(|position|behavior)).+$/i;

const STYLE_PROPERTIES = [
  "background-color",
  "border",
  "border-bottom",
  "border-color",
  "border-left",
  "border-right",
  "border-style",
  "border-top",
  "border-width",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "line-height",
  "list-style-type",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "vertical-align",
  "white-space",
  "width",
];

const ALLOWED_IFRAME_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]);

function isAllowedIframeUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && ALLOWED_IFRAME_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function keepSupportedInlineImage(_tagName, attribs) {
  const src = attribs.src;

  if (
    typeof src === "string" &&
    /^data:/i.test(src) &&
    !/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]+={0,2}$/i.test(
      src,
    )
  ) {
    delete attribs.src;
  }

  return { tagName: "img", attribs };
}

function secureExternalLinks(tagName, attribs) {
  if (attribs.target?.toLowerCase() === "_blank") {
    attribs.rel = "noopener noreferrer";
  }

  return { tagName, attribs };
}

const SANITIZE_OPTIONS = {
  allowedTags: [
    "a",
    "b",
    "blockquote",
    "br",
    "caption",
    "code",
    "col",
    "colgroup",
    "dd",
    "div",
    "dl",
    "dt",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "iframe",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
    "video",
    "source",
  ],
  allowedAttributes: {
    "*": ["align", "class", "style", "title"],
    a: ["href", "name", "rel", "target"],
    col: ["span", "width"],
    iframe: [
      "allowfullscreen",
      "frameborder",
      "height",
      "src",
      "title",
      "width",
    ],
    img: ["alt", "height", "src", "title", "width"],
    source: ["src", "type"],
    td: ["colspan", "headers", "rowspan", "width", "height"],
    th: ["abbr", "colspan", "headers", "rowspan", "scope", "width", "height"],
    video: ["controls", "height", "poster", "preload", "src", "width"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    iframe: ["https"],
    img: ["http", "https", "data"],
    source: ["http", "https"],
    video: ["http", "https"],
  },
  allowedIframeHostnames: [...ALLOWED_IFRAME_HOSTS],
  allowedStyles: {
    "*": Object.fromEntries(
      STYLE_PROPERTIES.map((property) => [property, [SAFE_STYLE_VALUE]]),
    ),
  },
  transformTags: {
    a: secureExternalLinks,
    img: keepSupportedInlineImage,
  },
  exclusiveFilter: (frame) =>
    (frame.tag === "img" && !frame.attribs.src) ||
    (frame.tag === "iframe" && !isAllowedIframeUrl(frame.attribs.src)),
};

export function sanitizePostHtml(html) {
  if (typeof html !== "string" || !html) return "";

  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
