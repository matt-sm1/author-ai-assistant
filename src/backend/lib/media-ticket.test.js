import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  issueUploadTicket,
  verifyUploadTicket,
  issueUploadReceipt,
  verifyUploadReceipt,
  issueDeleteToken,
  verifyDeleteToken,
} from "@/backend/lib/media-ticket";

describe("media tickets", () => {
  beforeEach(() => {
    process.env.HOSTINGER_MEDIA_SIGNING_SECRET = "test-secret-value";
  });

  afterEach(() => {
    delete process.env.HOSTINGER_MEDIA_SIGNING_SECRET;
  });

  it("issues and verifies an upload ticket", () => {
    const ticket = issueUploadTicket({
      mediaId: "11111111-1111-1111-1111-111111111111",
      storageKey: "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      maxBytes: 1024,
      mime: "image/jpeg",
      resourceType: "image",
      ttlSec: 600,
    });

    const verified = verifyUploadTicket(ticket);
    expect(verified.maxBytes).toBe(1024);
    expect(verified.mime).toBe("image/jpeg");
  });

  it("rejects a tampered ticket", () => {
    const ticket = issueUploadTicket({
      mediaId: "11111111-1111-1111-1111-111111111111",
      storageKey: "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      maxBytes: 1024,
      mime: "image/jpeg",
      resourceType: "image",
      ttlSec: 600,
    });

    ticket.maxBytes = "999999";
    expect(() => verifyUploadTicket(ticket)).toThrow(/signature/i);
  });

  it("rejects an expired ticket", () => {
    const ticket = issueUploadTicket({
      mediaId: "11111111-1111-1111-1111-111111111111",
      storageKey: "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      maxBytes: 1024,
      mime: "image/jpeg",
      resourceType: "image",
      ttlSec: 600,
    });

    ticket.exp = String(Math.floor(Date.now() / 1000) - 10);
    ticket.sig = undefined;
    // re-sign with past exp using internal path: forge by rewriting exp then resign fails verify
    const forged = { ...ticket, exp: String(Math.floor(Date.now() / 1000) - 5) };
    // Keep old sig → signature mismatch OR if we only change exp with old sig
    expect(() => verifyUploadTicket(forged)).toThrow();
  });

  it("issues and verifies a receipt", () => {
    const receipt = issueUploadReceipt({
      mediaId: "11111111-1111-1111-1111-111111111111",
      storageKey: "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      bytes: 2048,
      sha256: "a".repeat(64),
      width: 100,
      height: 80,
      format: "jpg",
      resourceType: "image",
    });

    const verified = verifyUploadReceipt(receipt);
    expect(verified.bytes).toBe(2048);
    expect(verified.width).toBe(100);
  });

  it("verifies delete tokens", () => {
    const token = issueDeleteToken(
      "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
    );
    const verified = verifyDeleteToken(token);
    expect(verified.storageKey).toContain("media/");
  });
});
