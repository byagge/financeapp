import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { dateFnsLocale } from "@/lib/locale";

export type Period = "day" | "week" | "month" | "year";

/** Home/balances period filter: today, week, or anything from the sheet. */
export type PeriodKey = "day" | "week" | "custom";

export type DateRange = {
  from: string;
  to: string;
};

export type PeriodFilter = DateRange & {
  key: PeriodKey;
};

function dateLocale(locale: string) {
  return dateFnsLocale(locale);
}

export function getPeriodRange(period: Period, base = new Date()): DateRange {
  if (period === "day") {
    return {
      from: format(startOfDay(base), "yyyy-MM-dd"),
      to: format(endOfDay(base), "yyyy-MM-dd"),
    };
  }
  if (period === "week") {
    return {
      from: format(startOfWeek(base, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      to: format(endOfWeek(base, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  if (period === "month") {
    return {
      from: format(startOfMonth(base), "yyyy-MM-dd"),
      to: format(endOfMonth(base), "yyyy-MM-dd"),
    };
  }
  return {
    from: format(startOfYear(base), "yyyy-MM-dd"),
    to: format(endOfYear(base), "yyyy-MM-dd"),
  };
}

/** Current month + previous 2 months (three calendar months). */
export function getThreeMonthsRange(base = new Date()): DateRange {
  return {
    from: format(startOfMonth(subMonths(base, 2)), "yyyy-MM-dd"),
    to: format(endOfMonth(base), "yyyy-MM-dd"),
  };
}

export function defaultPeriodFilter(key: PeriodKey = "day"): PeriodFilter {
  const range = getPeriodRange(key === "custom" ? "day" : key);
  return { key, ...range };
}

/** Display dates as 19.07.2026 */
export function formatDisplayDate(iso: string) {
  try {
    return format(parseISO(iso), "dd.MM.yyyy");
  } catch {
    return iso;
  }
}

/** Short range for the custom pill: 19.07 – 27.07 */
export function formatRangeShort(from: string, to: string) {
  try {
    const a = parseISO(from);
    const b = parseISO(to);
    if (from === to) return format(a, "dd.MM");
    return `${format(a, "dd.MM")} – ${format(b, "dd.MM")}`;
  } catch {
    return `${from} – ${to}`;
  }
}

/** Подписи периода: «26 июля», «20–26 июля», «июль», «2026» */
export function formatPeriodLabel(
  period: Period,
  locale = "ru",
  base = new Date()
) {
  const loc = dateLocale(locale);

  if (period === "day") {
    return format(base, "d MMMM", { locale: loc });
  }

  if (period === "week") {
    const from = startOfWeek(base, { weekStartsOn: 1 });
    const to = endOfWeek(base, { weekStartsOn: 1 });
    const sameMonth = from.getMonth() === to.getMonth();
    if (sameMonth) {
      return `${format(from, "d", { locale: loc })}–${format(to, "d MMMM", { locale: loc })}`;
    }
    return `${format(from, "d MMM", { locale: loc })} – ${format(to, "d MMM", { locale: loc })}`;
  }

  if (period === "month") {
    return format(base, "LLLL", { locale: loc });
  }

  return format(base, "yyyy", { locale: loc });
}

export function greetingKey(date = new Date()): "morning" | "day" | "evening" | "night" {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "day";
  if (h >= 17 && h < 23) return "evening";
  return "night";
}

export function formatHeaderDate(date = new Date(), locale = "ru") {
  return format(date, "EEE, d MMMM yyyy", {
    locale: dateLocale(locale),
  });
}

export function formatGroupDate(iso: string, locale = "ru") {
  try {
    return format(new Date(`${iso}T12:00:00`), "d EEE MM.yyyy", {
      locale: dateLocale(locale),
    });
  } catch {
    return iso;
  }
}
