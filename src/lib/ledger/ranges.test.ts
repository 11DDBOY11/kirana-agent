import { describe, expect, it } from "vitest";

import { currentMonthRange, lastSevenDaysRange, todayRange } from "@/lib/ledger/ranges";

describe("Indian ledger date ranges", () => {
  it("uses the India calendar month at a UTC month boundary", () => {
    const range = currentMonthRange(new Date("2026-06-30T20:00:00.000Z"));
    expect(range.start.toISOString()).toBe("2026-06-30T18:30:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T18:30:00.000Z");
  });

  it("includes today and the previous six full Indian calendar days", () => {
    const range = lastSevenDaysRange(new Date("2026-01-05T10:00:00.000Z"));
    expect(range.start.toISOString()).toBe("2025-12-29T18:30:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-05T18:30:00.000Z");
    expect(todayRange(new Date("2026-01-05T10:00:00.000Z")).start.toISOString()).toBe("2026-01-04T18:30:00.000Z");
  });
});
