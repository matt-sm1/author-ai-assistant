import { describe, expect, it } from "vitest";
import {
  karachiDateTimeLocalMin,
  karachiDateTimeToISO,
  toLocalDateTime,
} from "@/frontend/lib/format";

describe("Karachi datetime helpers", () => {
  it("formats datetime-local min as YYYY-MM-DDTHH:mm", () => {
    const value = karachiDateTimeLocalMin(
      new Date("2026-06-15T12:00:00.000Z"),
    );
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(toLocalDateTime(new Date("2026-06-15T12:00:00.000Z"))).toBe(value);
  });

  it("converts PKT wall clock to ISO", () => {
    const iso = karachiDateTimeToISO("2026-06-15T17:00");
    expect(iso).toBe("2026-06-15T12:00:00.000Z");
  });
});
