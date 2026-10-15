import { describe, expect, it } from "vitest";
import { AppError } from "@/backend/errors/app-error";
import {
  assertSafePagination,
  parsePaginationParams,
} from "@/backend/lib/pagination";

describe("assertSafePagination", () => {
  it("returns offset for valid page/limit", () => {
    expect(assertSafePagination(2, 10)).toEqual({
      page: 2,
      limit: 10,
      offset: 10,
    });
  });

  it("rejects unsafe product overflow", () => {
    expect(() =>
      assertSafePagination(Number.MAX_SAFE_INTEGER, 10)
    ).toThrow(AppError);
  });

  it("rejects limit above max", () => {
    expect(() => assertSafePagination(1, 101)).toThrow(AppError);
  });
});

describe("parsePaginationParams", () => {
  it("reads page and limit from URLSearchParams", () => {
    const params = new URLSearchParams({ page: "3", limit: "20" });
    expect(parsePaginationParams(params)).toEqual({
      page: 3,
      limit: 20,
      offset: 40,
    });
  });
});
