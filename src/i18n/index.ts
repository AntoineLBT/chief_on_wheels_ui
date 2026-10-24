import { en as vuetifyEn, fr as vuetifyFr } from "vuetify/locale";
import { createI18n } from "vue-i18n";
import en from "./en";
import fr from "./fr";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

const LOCALE_KEY = "locale";

/** The language chosen on this device, French by default. */
export function storedLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  return locales.find((locale) => locale === stored) ?? "fr";
}

export const i18n = createI18n({
  legacy: false,
  locale: storedLocale(),
  fallbackLocale: "en",
  // French uses the singular for 0 and 1 ("0 commande").
  pluralRules: { fr: (choice: number) => (choice > 1 ? 1 : 0) },
  // Vuetify reads its own strings under $vuetify, through its vue-i18n adapter.
  messages: {
    fr: { ...fr, $vuetify: vuetifyFr },
    en: { ...en, $vuetify: vuetifyEn },
  },
});

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(LOCALE_KEY, locale);
}
