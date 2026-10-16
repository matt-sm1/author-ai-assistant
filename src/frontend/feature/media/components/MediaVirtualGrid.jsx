"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import MediaCard from "@/frontend/feature/media/components/MediaCard";

const ROW_HEIGHT = 280;
const GAP = 16;
/** Prefer a plain CSS grid for small pages — virtualizer needs a scrollport. */
const VIRTUALIZE_AFTER = 12;

function useColumnCount(width) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function PlainGrid({ items, columns, onItemClick }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item, index) => (
        <MediaCard
          key={item.id ?? index}
          item={item}
          priority={index < 2}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  );
}

/**
 * Virtualized media grid — only mounts rows near the viewport for large lists.
 */
export default function MediaVirtualGrid({ items, onItemClick }) {
  const parentRef = useRef(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width;
      if (typeof next === "number" && next > 0) {
        setWidth(next);
      }
    });

    ro.observe(el);
    setWidth(el.clientWidth || 1200);
    return () => ro.disconnect();
  }, []);

  const columns = useColumnCount(width);
  const shouldVirtualize = items.length > VIRTUALIZE_AFTER;
  const rowCount = Math.ceil(items.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? rowCount : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + GAP,
    overscan: 3,
  });

  if (!shouldVirtualize) {
    return (
      <div ref={parentRef} className="w-full">
        <PlainGrid items={items} columns={columns} onItemClick={onItemClick} />
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="w-full overflow-y-auto"
      style={{ maxHeight: Math.min(720, Math.max(400, ROW_HEIGHT * 2.5)) }}
    >
      <div className="relative w-full" style={{ height: totalSize }}>
        {virtualRows.map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowItems = items.slice(start, start + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 grid w-full gap-4"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <MediaCard
                  key={item.id ?? `${start}-${colIndex}`}
                  item={item}
                  priority={virtualRow.index === 0 && colIndex < 2}
                  onClick={() => onItemClick?.(item)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
