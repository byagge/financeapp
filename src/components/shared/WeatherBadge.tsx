"use client";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useWeather, useWeatherCity } from "@/hooks/useWeather";
import { cityLabel, findCity } from "@/lib/weatherCities";
import { cn } from "@/lib/utils";

function WeatherIcon({
  kind,
  className,
}: {
  kind: string;
  className?: string;
}) {
  const cls = cn("w-[18px] h-[18px]", className);
  switch (kind) {
    case "clear":
      return <Sun className={cls} strokeWidth={1.9} />;
    case "cloudy":
      return <CloudSun className={cls} strokeWidth={1.9} />;
    case "rain":
      return <CloudRain className={cls} strokeWidth={1.9} />;
    case "snow":
      return <CloudSnow className={cls} strokeWidth={1.9} />;
    case "storm":
      return <CloudLightning className={cls} strokeWidth={1.9} />;
    case "fog":
      return <CloudFog className={cls} strokeWidth={1.9} />;
    default:
      return <Cloud className={cls} strokeWidth={1.9} />;
  }
}

export function WeatherBadge({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const { cityId, ready } = useWeatherCity();
  const { data, isLoading } = useWeather(cityId, ready);

  const name = data
    ? data.names[locale] ||
      data.names.ru ||
      (findCity(data.cityId)
        ? cityLabel(findCity(data.cityId)!, locale)
        : "")
    : "";

  return (
    <Link
      href="/settings"
      className={cn(
        "min-w-[3.25rem] h-12 px-2.5 rounded-xl bg-card border border-line-strong flex flex-col items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(17,24,39,0.04)] active:bg-surface",
        className
      )}
      title={name ? `${name}: ${data?.temp}°` : t("weather")}
      aria-label={
        data ? `${name} ${data.temp}°` : isLoading ? "…" : t("weather")
      }
    >
      {data ? (
        <>
          <WeatherIcon kind={data.kind} className="text-primary" />
          <span className="text-[12px] font-semibold tabular-nums leading-none mt-0.5 text-foreground">
            {data.temp}°
          </span>
        </>
      ) : (
        <span className="text-[12px] text-muted">…</span>
      )}
    </Link>
  );
}
