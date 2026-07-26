import { format, parseISO } from "date-fns";
import { enUS, ru, uzCyrl } from "date-fns/locale";

const locales = { ru, uz: uzCyrl, en: enUS } as const;

const SOM = "с";

function formatNumber(amount: number, fractionDigits: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Баланс: "25 423,00 с" */
export function formatBalance(amount: number, _locale = "ru") {
  return `${formatNumber(amount, 2)} ${SOM}`;
}

/** Сумма в списке: "+500 с" / "−500 с" */
export function formatMoney(amount: number, _locale = "ru") {
  const abs = Math.abs(amount);
  const formatted = formatNumber(abs, amount % 1 === 0 ? 0 : 2);
  if (amount > 0) return `+${formatted} ${SOM}`;
  if (amount < 0) return `−${formatted} ${SOM}`;
  return `${formatted} ${SOM}`;
}

/** Отображение ввода на keypad с сохранением точки */
export function formatKeypadAmount(raw: string) {
  if (!raw || raw === "0") return `0 ${SOM}`;
  const hasDot = raw.includes(".");
  const endsWithDot = raw.endsWith(".");
  const [intPart, decPart = ""] = raw.split(".");
  const intFormatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Number(intPart || "0"));

  if (endsWithDot) return `${intFormatted}. ${SOM}`;
  if (hasDot) return `${intFormatted}.${decPart} ${SOM}`;
  return `${intFormatted} ${SOM}`;
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
