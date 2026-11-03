import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./format";

describe("formatRelativeTime", () => {
  it("returns Never for nullish values", () => {
    expect(formatRelativeTime(null)).toBe("Never");
    expect(formatRelativeTime(undefined)).toBe("Never");
    expect(formatRelativeTime("")).toBe("Never");
  });

  it("returns Unknown for invalid dates", () => {
    expect(formatRelativeTime("not-a-date")).toBe("Unknown");
  });

  it("returns Just now for timestamps less than a minute old", () => {
    expect(formatRelativeTime(new Date(Date.now() - 30_000))).toBe("Just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60_000))).toBe(
      "5 minutes ago"
    );
    expect(formatRelativeTime(new Date(Date.now() - 60_000))).toBe("1 minute ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * 60 * 60_000))).toBe(
      "3 hours ago"
    );
    expect(formatRelativeTime(new Date(Date.now() - 60 * 60_000))).toBe(
      "1 hour ago"
    );
  });

  it("formats days", () => {
    expect(formatRelativeTime(new Date(Date.now() - 4 * 24 * 60 * 60_000))).toBe(
      "4 days ago"
    );
    expect(formatRelativeTime(new Date(Date.now() - 24 * 60 * 60_000))).toBe(
      "1 day ago"
    );
  });

  it("falls back to a locale date string beyond 30 days", () => {
    const date = new Date(Date.now() - 45 * 24 * 60 * 60_000);
    expect(formatRelativeTime(date)).toBe(date.toLocaleDateString());
  });
});
