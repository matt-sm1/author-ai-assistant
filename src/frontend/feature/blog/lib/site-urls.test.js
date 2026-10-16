import { afterEach, describe, expect, it } from "vitest";
import {
  getMarketingSiteUrl,
  getPublicSiteUrl,
  marketingPath,
  publicPostUrl,
} from "@/frontend/feature/blog/lib/site-urls";

describe("Feature: Public site URL helpers", () => {
  const originalMarketing = process.env.NEXT_PUBLIC_MARKETING_SITE_URL;
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalMarketing === undefined) {
      delete process.env.NEXT_PUBLIC_MARKETING_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_MARKETING_SITE_URL = originalMarketing;
    }
    if (originalSite === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    }
  });

  describe("Scenario: Marketing chrome links", () => {
    it("Given no env, When getMarketingSiteUrl, Then default marketing host", () => {
      delete process.env.NEXT_PUBLIC_MARKETING_SITE_URL;
      expect(getMarketingSiteUrl()).toBe("https://authoraiassistant.com");
    });

    it("Given trailing slash env, When marketingPath, Then paths join cleanly", () => {
      process.env.NEXT_PUBLIC_MARKETING_SITE_URL =
        "https://example.com/marketing/";
      expect(marketingPath("/")).toBe("https://example.com/marketing");
      expect(marketingPath("/pricing")).toBe(
        "https://example.com/marketing/pricing"
      );
      expect(marketingPath("features")).toBe(
        "https://example.com/marketing/features"
      );
    });
  });

  describe("Scenario: Canonical article URLs for /blogs rewrite", () => {
    it("Given NEXT_PUBLIC_SITE_URL with /blogs, When publicPostUrl, Then absolute canonical", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://authoraiassistant.com/blogs/";
      expect(publicPostUrl("my-post")).toBe(
        "https://authoraiassistant.com/blogs/my-post"
      );
      expect(getPublicSiteUrl()).toBe("https://authoraiassistant.com/blogs");
    });

    it("Given no SITE_URL, When publicPostUrl, Then relative path", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      expect(getPublicSiteUrl()).toBe("");
      expect(publicPostUrl("my-post")).toBe("/my-post");
    });
  });
});
