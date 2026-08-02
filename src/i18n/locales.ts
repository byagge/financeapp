export const locales = ["ru", "uz", "uz-Latn", "ky", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "ru";

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

/** ISO country code for flagcdn (language → flag). */
export const localeFlagCountry: Record<AppLocale, string> = {
  ru: "ru",
  uz: "uz",
  "uz-Latn": "uz",
  ky: "kg",
  en: "gb",
};

/** Native language names — always shown in their own language. */
export const localeNativeName: Record<AppLocale, string> = {
  ru: "Русский",
  uz: "Ўзбекча",
  "uz-Latn": "Oʻzbekcha",
  ky: "Кыргызча",
  en: "English",
};

/** Regex for pathname locale prefix (uz-Latn before uz). */
export const localePathPattern = /\/(uz-Latn|ru|uz|ky|en)(?=\/|$)/;
export const localePrefixPattern = /^\/(uz-Latn|ru|uz|ky|en)(\/|$)/;
