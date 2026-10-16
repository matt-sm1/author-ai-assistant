"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import MediaPicker from "@/frontend/components/ui/MediaPicker";

function EditorSkeleton() {
  return (
    <div
      className="animate-pulse rounded-md border bg-muted/40"
      style={{ height: 500 }}
      aria-hidden="true"
    >
      <div className="flex h-10 items-center gap-2 border-b px-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-12 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

const TinyEditor = dynamic(() => import("./PostContentEditorTiny"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

/**
 * Defers TinyMCE until the panel is near viewport or the user focuses/clicks.
 */
export default function PostContentEditor({ value = "", onChange }) {
  const containerRef = useRef(null);
  const insertCallbackRef = useRef(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [bodyPickerOpen, setBodyPickerOpen] = useState(false);

  const activate = useCallback(() => {
    setShouldMount(true);
  }, []);

  const handleRequestInsertMedia = useCallback(({ insert }) => {
    insertCallbackRef.current = insert;
    setBodyPickerOpen(true);
  }, []);

  useEffect(() => {
    if (shouldMount) return undefined;

    const el = containerRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    io.observe(el);

    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(() => setShouldMount(true), {
            timeout: 2500,
          })
        : setTimeout(() => setShouldMount(true), 1200);

    return () => {
      io.disconnect();
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idle);
      } else {
        clearTimeout(idle);
      }
    };
  }, [shouldMount]);

  return (
    <>
      {!shouldMount ? (
        <div
          ref={containerRef}
          role="button"
          tabIndex={0}
          onClick={activate}
          onFocus={activate}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              activate();
            }
          }}
          className="cursor-text outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Load content editor"
        >
          <EditorSkeleton />
          <p className="mt-2 text-xs text-muted-foreground">
            Click or focus to load the editor…
          </p>
        </div>
      ) : (
        <div ref={containerRef}>
          <TinyEditor
            value={value}
            onChange={onChange}
            onRequestInsertMedia={handleRequestInsertMedia}
          />
        </div>
      )}

      <MediaPicker
        open={bodyPickerOpen}
        onOpenChange={(open) => {
          setBodyPickerOpen(open);
          if (!open) insertCallbackRef.current = null;
        }}
        onSelect={(item) => {
          insertCallbackRef.current?.(item);
          insertCallbackRef.current = null;
          setBodyPickerOpen(false);
        }}
      />
    </>
  );
}
