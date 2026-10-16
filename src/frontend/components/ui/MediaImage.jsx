"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

import { cn } from "@/frontend/lib/utils";
import { toNestedHostingerMediaUrl } from "@/frontend/lib/hostinger-media-url";

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
 * Hostinger-first media renderer (native <img>).
 * On error, retries once with the legacy nested /media/media/... path.
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
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedNested, setTriedNested] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedNested(false);
    setFailed(false);
  }, [src]);

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

  if (!currentSrc || !isHttpUrl(currentSrc) || failed) {
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
      src={currentSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      onLoad={onLoad}
      onError={(event) => {
        if (!triedNested) {
          const nested = toNestedHostingerMediaUrl(currentSrc);
          if (nested && nested !== currentSrc) {
            setTriedNested(true);
            setCurrentSrc(nested);
            return;
          }
        }
        setFailed(true);
        onError?.(event);
      }}
    />
  );
});

export default MediaImage;
