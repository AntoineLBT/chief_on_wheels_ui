import { i18n, type Locale } from "@/i18n";

const intlLocales: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

// Reading the locale ref makes templates re-render on a language switch.
function intlLocale() {
  return intlLocales[i18n.global.locale.value];
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatCoefficient(value: number | null) {
  if (value === null) return "—";
  const number = new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `×${number}`;
}

// ISO dates (YYYY-MM-DD) are read as local midnights.
function localDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`);
}

export function formatDate(isoDate: string) {
  return localDate(isoDate).toLocaleDateString(intlLocale());
}

export function formatMonth(isoDate: string) {
  return localDate(isoDate).toLocaleDateString(intlLocale(), {
    month: "long",
    year: "numeric",
  });
}

export function formatTime(isoDateTime: string) {
  return new Date(isoDateTime).toLocaleTimeString(intlLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}
