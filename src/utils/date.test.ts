import { describe, expect, it } from "vitest";
import { ceilToMinuteStep } from "@/utils/date";

describe("ceilToMinuteStep", () => {
  it("keeps a time already on the step", () => {
    expect(ceilToMinuteStep(new Date(2026, 9, 25, 12, 15), 5)).toEqual({
      hours: 12,
      minutes: 15,
    });
  });

  it("rounds up to the next step", () => {
    expect(ceilToMinuteStep(new Date(2026, 9, 25, 12, 16), 5)).toEqual({
      hours: 12,
      minutes: 20,
    });
  });

  it("carries into the next hour", () => {
    expect(ceilToMinuteStep(new Date(2026, 9, 25, 12, 57), 5)).toEqual({
      hours: 13,
      minutes: 0,
    });
  });

  it("wraps past midnight", () => {
    expect(ceilToMinuteStep(new Date(2026, 9, 25, 23, 58), 5)).toEqual({
      hours: 0,
      minutes: 0,
    });
  });
});
