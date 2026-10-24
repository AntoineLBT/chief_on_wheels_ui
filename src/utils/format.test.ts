import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import {
  formatCoefficient,
  formatDate,
  formatMonth,
  formatPrice,
  formatTime,
} from "@/utils/format";

const NBSP = " ";

describe("formats", () => {
  afterEach(() => setLocale("fr"));

  it("formats prices in euros, following the language", () => {
    setLocale("fr");
    expect(formatPrice(10.8)).toBe(`10,80${NBSP}€`);
    expect(formatPrice(-192)).toBe(`-192,00${NBSP}€`);

    setLocale("en");
    expect(formatPrice(10.8)).toBe("€10.80");
  });

  it("formats dates, months and times", () => {
    setLocale("fr");
    const noon = new Date(2026, 9, 25, 12, 0).toISOString();

    expect(formatDate("2026-10-25")).toBe("25/10/2026");
    expect(formatMonth("2026-10-01")).toBe("octobre 2026");
    expect(formatTime(noon)).toBe("12:00");

    setLocale("en");
    expect(formatMonth("2026-10-01")).toBe("October 2026");
  });

  it("formats the price / cost coefficient", () => {
    setLocale("fr");
    expect(formatCoefficient(2.5)).toBe("×2,50");
    expect(formatCoefficient(null)).toBe("—");
  });
});
