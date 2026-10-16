/**
 * Feature: Admin auth gate after public blog split
 *
 * As a staff user
 * I must authenticate at /admin/login
 * So that / remains the public blog and CMS stays protected
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url) => {
  const error = new Error(`NEXT_REDIRECT:${url}`);
  error.digest = `NEXT_REDIRECT;${url}`;
  throw error;
});

vi.mock("next/navigation", () => ({
  redirect: (...args) => redirect(...args),
}));

vi.mock("@/backend/lib/auth-context", () => ({
  resolveAuthFromCookies: vi.fn(),
}));

import { resolveAuthFromCookies } from "@/backend/lib/auth-context";
import { requireAuth } from "@/backend/lib/require-auth";

describe("Feature: Admin auth gate after public blog split", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Scenario: Anonymous visitor hits a CMS page", () => {
    it("Given no session, When requireAuth runs, Then redirect to /admin/login", async () => {
      resolveAuthFromCookies.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
      expect(redirect).toHaveBeenCalledWith("/admin/login");
    });
  });

  describe("Scenario: Authenticated editor opens CMS", () => {
    it("Given a valid session, When requireAuth runs, Then AuthContext is returned", async () => {
      const auth = {
        userId: "u1",
        role: "editor",
        email: "ed@example.com",
        name: "Ed",
      };
      resolveAuthFromCookies.mockResolvedValue(auth);

      await expect(requireAuth()).resolves.toEqual(auth);
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
