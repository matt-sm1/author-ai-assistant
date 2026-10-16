"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

import { cn } from "@/frontend/lib/utils";

function isHttpUrl(src) {
  if (typeof src !== "string" || !src) return false;
  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Hostinger-first media renderer.
 * Uses native <img> for remote URLs so paint is not blocked by next/image
 * remotePatterns / optimizer failures.
 */
const MediaImage = forwardRef(function MediaImage(
  {
    src,
    alt = "",
    fill = false,
    width,
    height,
    className,
    priority = false,
    viewportLazy = false,
    onLoad,
    onError,
  },
  ref,
) {
  const rootRef = useRef(null);
  const [inView, setInView] = useState(!viewportLazy || priority);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!viewportLazy || priority || inView) return undefined;

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [viewportLazy, priority, inView]);

  if (!src || !isHttpUrl(src) || failed) {
    return (
      <div
        ref={rootRef}
        className={cn("bg-muted", fill && "absolute inset-0", className)}
        aria-hidden={!alt}
      />
    );
  }

  if (!inView) {
    return (
      <div
        ref={rootRef}
        className={cn(
          "animate-pulse bg-muted",
          fill && "absolute inset-0 h-full w-full",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      onLoad={onLoad}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
});

export default MediaImage;
