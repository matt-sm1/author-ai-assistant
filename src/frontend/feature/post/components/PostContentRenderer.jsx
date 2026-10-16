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
      className="prose-media max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img.img-left]:float-left [&_img.img-left]:mr-4 [&_img.img-left]:mb-4 [&_img.img-center]:mx-auto [&_img.img-center]:block [&_img.img-right]:float-right [&_img.img-right]:ml-4 [&_img.img-right]:mb-4"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
