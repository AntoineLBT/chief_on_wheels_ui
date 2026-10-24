import { afterEach, beforeEach, describe, expect, it } from "vitest";
import en from "@/i18n/en";
import fr from "@/i18n/fr";
import { i18n, setLocale, storedLocale } from "@/i18n";

function keys(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object"
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("catalogues", () => {
  it("translate exactly the same keys", () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });
});

describe("locale", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale("fr");
    localStorage.clear();
  });

  it("defaults to French", () => {
    expect(storedLocale()).toBe("fr");
  });

  it("switches the language and remembers it", () => {
    setLocale("en");

    expect(i18n.global.locale.value).toBe("en");
    expect(storedLocale()).toBe("en");
  });

  it("ignores an unknown stored language", () => {
    localStorage.setItem("locale", "de");

    expect(storedLocale()).toBe("fr");
  });
});

describe("plurals", () => {
  afterEach(() => setLocale("fr"));

  it("counts orders in both languages", () => {
    const { t } = i18n.global;

    setLocale("fr");
    expect([0, 1, 3].map((n) => t("count.orders", { n }, n))).toEqual([
      "0 commande",
      "1 commande",
      "3 commandes",
    ]);

    setLocale("en");
    expect([1, 3].map((n) => t("count.orders", { n }, n))).toEqual([
      "1 order",
      "3 orders",
    ]);
  });
});
