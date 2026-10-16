"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { cn } from "@/frontend/lib/utils";

/** 10×10 neutral shimmer used as blur placeholder */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

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
 * Hostinger-first media renderer. Falls back to native <img> so URLs never blank.
 * When `viewportLazy` is true, defers setting src until near the viewport.
 */
const MediaImage = forwardRef(function MediaImage(
  {
    src,
    alt = "",
    fill = false,
    width,
    height,
    sizes,
    className,
    priority = false,
    unoptimized = false,
    viewportLazy = false,
    onLoad,
    onError,
  },
  ref,
) {
  const rootRef = useRef(null);
  const [useNative, setUseNative] = useState(false);
  const [inView, setInView] = useState(!viewportLazy || priority);

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
      { rootMargin: "200px" },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [viewportLazy, priority, inView]);

  if (!src || !isHttpUrl(src)) {
    return (
      <div
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
          fill && "absolute inset-0",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  if (useNative) {
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
        onError={onError}
      />
    );
  }

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      decoding="async"
      className={className}
      onLoad={onLoad}
      onError={(event) => {
        setUseNative(true);
        onError?.(event);
      }}
    />
  );
});

export default MediaImage;
