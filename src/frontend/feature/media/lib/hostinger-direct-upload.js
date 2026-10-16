/**
 * Browser → Hostinger direct upload (single-shot or chunked).
 */

async function sha256Hex(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ticketHeader(ticket) {
  return JSON.stringify(ticket);
}

async function postJson(url, body, { signal } = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Upload request failed (${response.status})`);
  }
  return data;
}

/**
 * @param {object} options
 * @param {File} options.file
 * @param {object} options.session - from /api/media/upload-session
 * @param {(ratio: number) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 */
export async function uploadFileToHostinger({
  file,
  session,
  onProgress,
  signal,
}) {
  const { ticket, endpoints, useChunked, chunkSize } = session;

  if (!useChunked) {
    const form = new FormData();
    form.append("file", file);
    form.append("ticket", JSON.stringify(ticket));

    const response = await fetch(endpoints.upload, {
      method: "POST",
      headers: {
        "X-Upload-Ticket": ticketHeader(ticket),
      },
      body: form,
      signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.receipt) {
      throw new Error(data.message || "Direct upload failed");
    }
    onProgress?.(1);
    return data.receipt;
  }

  const initResponse = await fetch(endpoints.init, {
    method: "POST",
    headers: {
      "X-Upload-Ticket": ticketHeader(ticket),
      "Content-Type": "application/json",
    },
    body: "{}",
    signal,
  });
  const initData = await initResponse.json().catch(() => ({}));
  if (!initResponse.ok || initData.success === false) {
    throw new Error(initData.message || "Failed to init chunked upload");
  }

  const total = file.size;
  let offset = 0;
  let index = 0;

  while (offset < total) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const end = Math.min(offset + chunkSize, total);
    const blob = file.slice(offset, end);

    const chunkResponse = await fetch(endpoints.chunk, {
      method: "POST",
      headers: {
        "X-Upload-Ticket": ticketHeader(ticket),
        "X-Chunk-Index": String(index),
        "Content-Type": "application/octet-stream",
      },
      body: blob,
      signal,
    });

    const chunkData = await chunkResponse.json().catch(() => ({}));
    if (!chunkResponse.ok || chunkData.success === false) {
      throw new Error(chunkData.message || `Chunk ${index} failed`);
    }

    offset = end;
    index += 1;
    onProgress?.(offset / total);
  }

  const sha256 = await sha256Hex(file);
  const complete = await postJson(
    endpoints.complete,
    { ticket, sha256 },
    { signal },
  );

  if (!complete.receipt) {
    throw new Error("Missing upload receipt");
  }

  onProgress?.(1);
  return complete.receipt;
}
