import * as cc from "currency-codes";
import { currencyFlagCountry, currencyFlagUrl } from "./currencyFlags";

export { currencyFlagCountry, currencyFlagUrl };

/** Base currency for balances and stored exchange rates (KGS per 1 unit). */
export const BASE_CURRENCY = "KGS" as const;

export type CurrencyCode = string;

/** Home balance display switcher */
export const DISPLAY_CURRENCIES = ["KGS", "USD", "EUR", "RUB"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Quick-pick currencies when creating a transaction */
export const PRIMARY_CURRENCIES = ["KGS", "USD", "EUR", "UZS", "RUB"] as const;

/** Default wallets on “My currencies” for new (and existing) users. */
export const DEFAULT_WALLET_CURRENCIES = ["KGS", "USD", "EUR", "RUB"] as const;

const SYMBOLS: Record<string, string> = {
  KGS: "сом",
  USD: "$",
  EUR: "€",
  UZS: "сум",
  RUB: "₽",
  GBP: "£",
  CNY: "¥",
  JPY: "¥",
  KZT: "₸",
  TRY: "₺",
  UAH: "₴",
};

/** Short localized names — codes like KGS/EUR are unclear to many users. */
const SHORT_NAMES: Record<string, { ru: string; uz: string; en: string }> = {
  KGS: { ru: "Сом", uz: "Сом", en: "Som" },
  USD: { ru: "Доллар США", uz: "АҚШ доллари", en: "US Dollar" },
  EUR: { ru: "Евро", uz: "Евро", en: "Euro" },
  UZS: { ru: "Сум", uz: "Сўм", en: "Som" },
  RUB: { ru: "Рубль", uz: "Рубль", en: "Ruble" },
  GBP: { ru: "Фунт", uz: "Фунт", en: "Pound" },
  CNY: { ru: "Юань", uz: "Юань", en: "Yuan" },
  KZT: { ru: "Тенге", uz: "Тенге", en: "Tenge" },
  TRY: { ru: "Лира", uz: "Лира", en: "Lira" },
  AED: { ru: "Дирхам", uz: "Дирҳам", en: "Dirham" },
  CHF: { ru: "Франк", uz: "Франк", en: "Franc" },
  JPY: { ru: "Иена", uz: "Иена", en: "Yen" },
};

/** Extra aliases so Cyrillic search works even if Intl differs. */
const SEARCH_ALIASES: Record<string, string[]> = {
  KGS: ["сом", "кыргызский", "киргизский", "qirgiz", "қирғиз"],
  USD: ["доллар", "доллор", "бакс", "dollar", "aqsh", "ақш"],
  EUR: ["евро", "yevro", "еуро"],
  RUB: ["рубль", "рубл", "rubl"],
  UZS: ["сум", "so'm", "сўм", "so‘m"],
  GBP: ["фунт", "funt"],
  CNY: ["юань", "yuan", "юан"],
  KZT: ["тенге", "tenge"],
  TRY: ["лира", "lira"],
  AED: ["дирхам", "dirham"],
  CHF: ["франк", "frank"],
  JPY: ["иена", "йена", "yen"],
};

export type CurrencyInfo = {
  code: string;
  name: string;
  nameEn: string;
  nameRu: string;
  nameUz: string;
  symbol: string;
  digits: number;
  primary: boolean;
};

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function intlCurrencyName(code: string, locale: string, fallback: string) {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "currency" });
    const name = dn.of(code);
    return name ? capitalize(name) : fallback;
  } catch {
    return fallback;
  }
}

function displayName(code: string, englishName: string, locale: string) {
  const short = SHORT_NAMES[code.toUpperCase()];
  if (short) {
    if (locale === "uz") return short.uz;
    if (locale === "uz-Latn") {
      if (code.toUpperCase() === "KGS") return "Soʻm";
      if (code.toUpperCase() === "UZS") return "Soʻm";
      return short.en;
    }
    if (locale === "ru" || locale === "ky") return short.ru;
    return short.en;
  }
  if (locale === "uz") {
    return intlCurrencyName(code, "uz-Cyrl", intlCurrencyName(code, "uz", englishName));
  }
  if (locale === "uz-Latn") {
    return intlCurrencyName(code, "uz", englishName);
  }
  if (locale === "ky") {
    return intlCurrencyName(code, "ky", intlCurrencyName(code, "ru", englishName));
  }
  if (locale === "ru") {
    return intlCurrencyName(code, "ru", englishName);
  }
  return intlCurrencyName(code, "en", englishName);
}

export function currencySymbol(code: string) {
  return SYMBOLS[code] || code;
}

function buildInfo(code: string, englishName: string, digits: number, locale: string): CurrencyInfo {
  const upper = code.toUpperCase();
  return {
    code: upper,
    name: displayName(upper, englishName, locale),
    nameEn: englishName,
    nameRu: intlCurrencyName(upper, "ru", englishName),
    nameUz: intlCurrencyName(upper, "uz-Cyrl", intlCurrencyName(upper, "uz", englishName)),
    symbol: currencySymbol(upper),
    digits,
    primary: (PRIMARY_CURRENCIES as readonly string[]).includes(upper),
  };
}

export function getCurrencyInfo(code: string, locale = "ru"): CurrencyInfo | null {
  const upper = code.toUpperCase();
  const row = cc.code(upper);
  if (!row) {
    if (upper === BASE_CURRENCY) {
      return buildInfo(upper, "Som", 2, locale);
    }
    return null;
  }
  return buildInfo(row.code, row.currency, row.digits, locale);
}

export function listCurrencies(locale = "ru"): CurrencyInfo[] {
  const items = cc.data
    .map((row) => buildInfo(row.code, row.currency, row.digits, locale))
    .filter((c) => Boolean(c.code));

  const order = new Map<string, number>(
    PRIMARY_CURRENCIES.map((c, i) => [c, i])
  );
  return items.sort((a, b) => {
    const ai = order.has(a.code) ? order.get(a.code)! : 999;
    const bi = order.has(b.code) ? order.get(b.code)! : 999;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, locale.startsWith("uz") ? "uz" : "ru");
  });
}

function matchesQuery(c: CurrencyInfo, q: string) {
  const hay = [
    c.code,
    c.name,
    c.nameEn,
    c.nameRu,
    c.nameUz,
    c.symbol,
    ...(SEARCH_ALIASES[c.code] || []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function searchCurrencies(query: string, locale = "ru"): CurrencyInfo[] {
  const q = query.trim().toLowerCase();
  const all = listCurrencies(locale);
  if (!q) return all;
  return all.filter((c) => matchesQuery(c, q));
}

export function isValidCurrency(code: string) {
  return Boolean(cc.code(code.toUpperCase()));
}

/** Convert amount in `from` to KGS using rates map (KGS per 1 unit). */
export function toKgs(amount: number, currency: string, ratesToKgs: Record<string, number>) {
  if (currency === BASE_CURRENCY) return amount;
  const rate = ratesToKgs[currency];
  if (!rate || !Number.isFinite(rate)) return amount;
  return amount * rate;
}

/** Convert KGS amount to `to` currency using rates map (KGS per 1 unit). */
export function fromKgs(amountKgs: number, to: string, ratesToKgs: Record<string, number>) {
  if (to === BASE_CURRENCY) return amountKgs;
  const rate = ratesToKgs[to];
  if (!rate || !Number.isFinite(rate) || rate === 0) return amountKgs;
  return amountKgs / rate;
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  ratesToKgs: Record<string, number>
) {
  if (from === to) return amount;
  return fromKgs(toKgs(amount, from, ratesToKgs), to, ratesToKgs);
}
