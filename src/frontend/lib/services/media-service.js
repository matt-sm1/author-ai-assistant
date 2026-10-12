import { sampleMedia } from "@/frontend/data/media";

// ---- DEMO MODE ----
// Refresh par uploaded media reset ho jayega.

let media = [...sampleMedia];

const delay = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getMediaTypeFromMime(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function getMediaTypeFromUrl(url = "") {
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(cleanUrl)) {
    return "image";
  }

  if (/\.(mp4|webm|mov|avi|mkv)$/i.test(cleanUrl)) {
    return "video";
  }

  return "document";
}

function getFilenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const filename = pathname.split("/").pop();

    return filename || "external-media";
  } catch {
    return "external-media";
  }
}

export async function getMedia() {
  await delay();

  // Baad mein:
  // const res = await fetch("/api/media");
  // return res.json();

  return [...media];
}

export async function uploadMedia(files) {
  await delay();

  const created = Array.from(files).map((file) => ({
    id: crypto.randomUUID(),
    filename: file.name,
    type: getMediaTypeFromMime(file.type),
    url: URL.createObjectURL(file),
    alt: "",
    caption: "",
    description: "",
    size: file.size,
    uploaded: new Date().toISOString(),
  }));

  media = [...created, ...media];

  // Baad mein:
  // FormData + POST /api/media

  return created;
}

export async function addMediaFromUrl(data) {
  await delay();

  const created = {
    id: crypto.randomUUID(),
    filename: data.filename || getFilenameFromUrl(data.url),
    type: data.type || getMediaTypeFromUrl(data.url),
    url: data.url,
    alt: data.alt || "",
    caption: data.caption || "",
    description: data.description || "",
    size: 0,
    uploaded: new Date().toISOString(),
  };

  media = [created, ...media];

  // Baad mein:
  // POST /api/media
  // Backend URL ko validate/store karega.

  return created;
}

export async function updateMedia(id, data) {
  await delay();

  media = media.map((item) =>
    item.id === id
      ? {
          ...item,
          ...data,
        }
      : item
  );

  // Baad mein:
  // PUT /api/media/:id

  return media.find((item) => item.id === id);
}

export async function deleteMedia(id) {
  await delay();

  const item = media.find((mediaItem) => mediaItem.id === id);

  if (item?.url?.startsWith("blob:")) {
    URL.revokeObjectURL(item.url);
  }

  media = media.filter((mediaItem) => mediaItem.id !== id);

  // Baad mein:
  // DELETE /api/media/:id

  return { ok: true };
}