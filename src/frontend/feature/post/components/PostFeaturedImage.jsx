import MediaImage from "@/frontend/components/ui/MediaImage";

export default function PostFeaturedImage({ src, title }) {
  if (!src) return null;

  const isVideo =
    /\/video\/upload\/|\.(?:mp4|m4v|mov|ogv|ogg|webm|m3u8)(?:[?#]|$)/i.test(
      src,
    );

  return (
    <div className="relative aspect-[16/8] w-full overflow-hidden bg-muted">
      {isVideo ? (
        <video
          className="h-full w-full object-cover"
          src={src}
          controls
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-label={`Featured video for ${title || "post"}`}
        />
      ) : (
        <MediaImage
          src={src}
          alt={title ? `Featured image for ${title}` : ""}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      )}
    </div>
  );
}
