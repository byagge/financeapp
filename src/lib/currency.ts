import * as cc from "currency-codes";

/** Base currency for balances and stored exchange rates (KGS per 1 unit). */
export const BASE_CURRENCY = "KGS" as const;

export type CurrencyCode = string;

/** Home balance display switcher */
export const DISPLAY_CURRENCIES = ["KGS", "USD", "EUR", "RUB"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Quick-pick currencies when creating a transaction */
export const PRIMARY_CURRENCIES = ["KGS", "USD", "EUR", "UZS", "RUB"] as const;

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

const RU_NAMES: Record<string, string> = {
  KGS: "Кыргызский сом",
  USD: "Доллар США",
  EUR: "Евро",
  UZS: "Узбекский сум",
  RUB: "Российский рубль",
  GBP: "Фунт стерлингов",
  CNY: "Китайский юань",
  KZT: "Казахстанский тенге",
  TRY: "Турецкая лира",
  UAH: "Украинская гривна",
  CHF: "Швейцарский франк",
  JPY: "Японская иена",
  AED: "Дирхам ОАЭ",
  SAR: "Саудовский риял",
  INR: "Индийская рупия",
  KRW: "Южнокорейская вона",
  CAD: "Канадский доллар",
  AUD: "Австралийский доллар",
  BYN: "Белорусский рубль",
  TJS: "Таджикский сомони",
  TMT: "Туркменский манат",
  AZN: "Азербайджанский манат",
  AMD: "Армянский драм",
  GEL: "Грузинский лари",
  MDL: "Молдавский лей",
  PLN: "Польский злотый",
};

export type CurrencyInfo = {
  code: string;
  name: string;
  nameEn: string;
  symbol: string;
  digits: number;
  primary: boolean;
};

function displayName(code: string, englishName: string, locale: string) {
  if (locale.startsWith("ru") || locale.startsWith("uz")) {
    return RU_NAMES[code] || englishName;
  }
  try {
    const dn = new Intl.DisplayNames([locale], { type: "currency" });
    return dn.of(code) || englishName;
  } catch {
    return englishName;
  }
}

export function currencySymbol(code: string) {
  return SYMBOLS[code] || code;
}

export function getCurrencyInfo(code: string, locale = "ru"): CurrencyInfo | null {
  const upper = code.toUpperCase();
  const row = cc.code(upper);
  if (!row) {
    if (upper === BASE_CURRENCY) {
      return {
        code: upper,
        name: displayName(upper, "Som", locale),
        nameEn: "Som",
        symbol: currencySymbol(upper),
        digits: 2,
        primary: true,
      };
    }
    return null;
  }
  return {
    code: row.code,
    name: displayName(row.code, row.currency, locale),
    nameEn: row.currency,
    symbol: currencySymbol(row.code),
    digits: row.digits,
    primary: (PRIMARY_CURRENCIES as readonly string[]).includes(row.code),
  };
}

export function listCurrencies(locale = "ru"): CurrencyInfo[] {
  const primarySet = new Set<string>(PRIMARY_CURRENCIES);
  const items = cc.data
    .map((row) => ({
      code: row.code,
      name: displayName(row.code, row.currency, locale),
      nameEn: row.currency,
      symbol: currencySymbol(row.code),
      digits: row.digits,
      primary: primarySet.has(row.code),
    }))
    .filter((c) => Boolean(c.code));

  const order = new Map<string, number>(
    PRIMARY_CURRENCIES.map((c, i) => [c, i])
  );
  return items.sort((a, b) => {
    const ai = order.has(a.code) ? order.get(a.code)! : 999;
    const bi = order.has(b.code) ? order.get(b.code)! : 999;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, locale);
  });
}

export function searchCurrencies(query: string, locale = "ru"): CurrencyInfo[] {
  const q = query.trim().toLowerCase();
  const all = listCurrencies(locale);
  if (!q) return all;
  return all.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
  );
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
