import { format, parseISO } from "date-fns";
import { enUS, ru, uzCyrl } from "date-fns/locale";
import { BASE_CURRENCY, currencySymbol } from "@/lib/currency";

const locales = { ru, uz: uzCyrl, en: enUS } as const;

function formatNumber(amount: number, fractionDigits: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

function digitsFor(amount: number, currency: string) {
  if (currency === "UZS" || currency === "KZT") {
    return amount % 1 === 0 ? 0 : 2;
  }
  return amount % 1 === 0 ? 0 : 2;
}

/** Баланс: "25 423,00 сом" */
export function formatBalance(
  amount: number,
  _locale = "ru",
  currency: string = BASE_CURRENCY
) {
  return `${formatNumber(amount, 2)} ${currencySymbol(currency)}`;
}

/** Сумма в списке: "+500 $" / "−500 сом" */
export function formatMoney(
  amount: number,
  _locale = "ru",
  currency: string = BASE_CURRENCY
) {
  const abs = Math.abs(amount);
  const formatted = formatNumber(abs, digitsFor(abs, currency));
  const sym = currencySymbol(currency);
  if (amount > 0) return `+${formatted} ${sym}`;
  if (amount < 0) return `−${formatted} ${sym}`;
  return `${formatted} ${sym}`;
}

/** Отображение ввода на keypad с сохранением точки */
export function formatKeypadAmount(raw: string, currency: string = BASE_CURRENCY) {
  const sym = currencySymbol(currency);
  if (!raw || raw === "0") return `0 ${sym}`;
  const hasDot = raw.includes(".");
  const endsWithDot = raw.endsWith(".");
  const [intPart, decPart = ""] = raw.split(".");
  const intFormatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(intPart || "0"));

  if (endsWithDot) return `${intFormatted}. ${sym}`;
  if (hasDot) return `${intFormatted}.${decPart} ${sym}`;
  return `${intFormatted} ${sym}`;
}

export function formatRate(rate: number, currency: string = BASE_CURRENCY) {
  if (!Number.isFinite(rate)) return "—";
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return `1 ${currencySymbol(currency)} = ${formatNumber(rate, digits)} ${currencySymbol(BASE_CURRENCY)}`;
}

export function formatTxDate(
  isoDate: string,
  createdAt: string,
  locale: "ru" | "uz" = "ru"
) {
  try {
    const date = parseISO(
      createdAt.includes("T") ? createdAt : `${isoDate}T12:00:00`
    );
    return format(date, "d MMM - HH:mm", {
      locale: locale === "uz" ? uzCyrl : ru,
    });
  } catch {
    return isoDate;
  }
}

export function formatDayLabel(isoDate: string, locale: "ru" | "uz" = "ru") {
  try {
    return format(parseISO(isoDate), "d MMMM yyyy", {
      locale: locales[locale],
    });
  } catch {
    return isoDate;
  }
}
