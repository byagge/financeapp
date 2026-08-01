import flagMap from "./currencyFlags.generated.json";

/** Hard overrides when currency-codes lists the wrong “primary” country. */
const OVERRIDES: Record<string, string> = {
  USD: "us",
  GBP: "gb",
  INR: "in",
  CHF: "ch",
  AUD: "au",
  CAD: "ca",
  NZD: "nz",
  EUR: "eu",
  KGS: "kg",
  UZS: "uz",
  RUB: "ru",
};

/** ISO country/region code for flagcdn (e.g. us, eu, kg). */
export function currencyFlagCountry(code: string): string | null {
  const upper = code.toUpperCase();
  if (OVERRIDES[upper]) return OVERRIDES[upper];
  const mapped = (flagMap as Record<string, string>)[upper];
  return mapped || null;
}

/** Sharp SVG flag from flagcdn. */
export function currencyFlagUrl(code: string): string | null {
  const country = currencyFlagCountry(code);
  if (!country) return null;
  return `https://flagcdn.com/${country}.svg`;
}

/** High-res PNG fallback (2x for retina). */
export function currencyFlagPngUrl(code: string, width = 160): string | null {
  const country = currencyFlagCountry(code);
  if (!country) return null;
  return `https://flagcdn.com/w${width}/${country}.png`;
}
