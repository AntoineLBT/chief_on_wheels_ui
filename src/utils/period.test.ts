import { describe, expect, it } from "vitest";
import { periodRange, stepPeriod } from "@/utils/period";

describe("periodRange", () => {
  it("spans the whole year", () => {
    expect(periodRange("year", "2026-06-15")).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });

  it("spans the whole month, leap years included", () => {
    expect(periodRange("month", "2026-10-15")).toEqual({
      start: "2026-10-01",
      end: "2026-10-31",
    });
    expect(periodRange("month", "2028-02-10")).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
    });
  });

  it("spans the ISO week, from Monday to Sunday", () => {
    const week = { start: "2026-09-28", end: "2026-10-04" };
    expect(periodRange("week", "2026-09-28")).toEqual(week);
    expect(periodRange("week", "2026-10-01")).toEqual(week);
    expect(periodRange("week", "2026-10-04")).toEqual(week);
  });
});

describe("stepPeriod", () => {
  it("moves to the start of the previous or next period", () => {
    expect(stepPeriod("year", "2026-06-15", -1)).toBe("2025-01-01");
    expect(stepPeriod("month", "2026-12-15", 1)).toBe("2027-01-01");
    expect(stepPeriod("month", "2026-03-31", -1)).toBe("2026-02-01");
    expect(stepPeriod("week", "2026-12-30", 1)).toBe("2027-01-04");
    expect(stepPeriod("week", "2026-10-01", -1)).toBe("2026-09-21");
  });
});
