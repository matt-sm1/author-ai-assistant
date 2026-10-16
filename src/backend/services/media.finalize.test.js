import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaService } from "@/backend/services/media.service";
import {
  issueUploadReceipt,
} from "@/backend/lib/media-ticket";

describe("MediaService finalizeUpload", () => {
  beforeEach(() => {
    process.env.STORAGE_PROVIDER = "hostinger";
    process.env.HOSTINGER_PUBLIC_BASE_URL = "https://cdn.example.com";
    process.env.HOSTINGER_MEDIA_API_BASE_URL = "https://cdn.example.com/media-api";
    process.env.HOSTINGER_MEDIA_SIGNING_SECRET = "test-secret-value";
  });

  it("is idempotent when media is already ready", async () => {
    const mediaId = "11111111-1111-1111-1111-111111111111";
    const storageKey = "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg";
    const ready = {
      id: mediaId,
      status: "ready",
      storage_key: storageKey,
      storage_provider: "hostinger",
      resource_type: "image",
      url: `https://cdn.example.com/${storageKey}`,
    };

    const repo = {
      findById: vi.fn().mockResolvedValue(ready),
      finalizePending: vi.fn(),
    };
    const storage = {
      getThumbnailUrl: () => ready.url,
      delete: vi.fn(),
    };

    const service = new MediaService(repo, storage);
    const receipt = issueUploadReceipt({
      mediaId,
      storageKey,
      bytes: 100,
      sha256: "b".repeat(64),
      format: "jpg",
      resourceType: "image",
    });

    const result = await service.finalizeUpload({ mediaId, receipt });
    expect(result.id).toBe(mediaId);
    expect(repo.finalizePending).not.toHaveBeenCalled();
  });

  it("rejects wrong receipt signature", async () => {
    const repo = {
      findById: vi.fn(),
      finalizePending: vi.fn(),
    };
    const service = new MediaService(repo, {
      getThumbnailUrl: () => null,
      delete: vi.fn(),
    });

    await expect(
      service.finalizeUpload({
        mediaId: "11111111-1111-1111-1111-111111111111",
        receipt: {
          mediaId: "11111111-1111-1111-1111-111111111111",
          storageKey: "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
          bytes: "10",
          sha256: "c".repeat(64),
          width: "",
          height: "",
          format: "jpg",
          resourceType: "image",
          exp: String(Math.floor(Date.now() / 1000) + 100),
          sig: "deadbeef",
        },
      }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/receipt|signature/i) });
  });

  it("promotes pending rows once", async () => {
    const mediaId = "11111111-1111-1111-1111-111111111111";
    const storageKey = "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg";
    const pending = {
      id: mediaId,
      status: "pending",
      storage_key: storageKey,
      storage_provider: "hostinger",
      resource_type: "image",
      size_bytes: 5000,
      format: "jpg",
    };
    const ready = { ...pending, status: "ready", url: `https://cdn.example.com/${storageKey}` };

    const repo = {
      findById: vi.fn().mockResolvedValue(pending),
      finalizePending: vi.fn().mockResolvedValue(ready),
    };
    const service = new MediaService(repo, {
      getThumbnailUrl: () => ready.url,
      delete: vi.fn(),
    });

    const receipt = issueUploadReceipt({
      mediaId,
      storageKey,
      bytes: 1000,
      sha256: "d".repeat(64),
      width: 10,
      height: 10,
      format: "jpg",
      resourceType: "image",
    });

    const result = await service.finalizeUpload({ mediaId, receipt });
    expect(repo.finalizePending).toHaveBeenCalledOnce();
    expect(result.status).toBe("ready");
  });
});
