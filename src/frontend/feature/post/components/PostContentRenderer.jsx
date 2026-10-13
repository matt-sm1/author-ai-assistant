import { sanitizePostHtml } from "@/frontend/feature/post/utils/sanitize-post-html";

export default function PostContentRenderer({ content }) {
  const sanitizedContent = sanitizePostHtml(content);

  if (!sanitizedContent) {
    return (
      <p className="text-sm text-muted-foreground">
        Article content is unavailable.
      </p>
    );
  }

  return (
    <div
      className=""
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
