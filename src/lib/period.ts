import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { enUS, ru, uzCyrl } from "date-fns/locale";

export type Period = "day" | "week" | "month" | "year";

function dateLocale(locale: "ru" | "uz") {
  return locale === "uz" ? uzCyrl : ru;
}

export function getPeriodRange(period: Period, base = new Date()) {
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

/** Подписи периода: «26 июля», «20–26 июля», «июль», «2026» */
export function formatPeriodLabel(
  period: Period,
  locale: "ru" | "uz" = "ru",
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

export function formatHeaderDate(date = new Date(), locale: "ru" | "uz" = "ru") {
  return format(date, "EEE, d MMMM yyyy", {
    locale: dateLocale(locale),
  });
}

export function formatGroupDate(iso: string, locale: "ru" | "uz" = "ru") {
  try {
    return format(new Date(`${iso}T12:00:00`), "d EEE MM.yyyy", {
      locale: locale === "uz" ? uzCyrl : enUS,
    });
  } catch {
    return iso;
  }
}
