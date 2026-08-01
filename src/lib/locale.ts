import { enUS, ru, uz, uzCyrl, type Locale } from "date-fns/locale";
import type { AppLocale } from "@/i18n/locales";

/** date-fns locale for app language codes. */
export function dateFnsLocale(locale: string): Locale {
  switch (locale) {
    case "uz":
      return uzCyrl;
    case "uz-Latn":
      return uz;
    case "en":
      return enUS;
    case "ky":
    case "ru":
    default:
      return ru;
  }
}

export function asAppLocale(locale: string): AppLocale {
  if (
    locale === "uz" ||
    locale === "uz-Latn" ||
    locale === "ky" ||
    locale === "en" ||
    locale === "ru"
  ) {
    return locale;
  }
  return "ru";
}
