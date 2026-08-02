"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWeather, useWeatherCity } from "@/hooks/useWeather";
import {
  cityLabel,
  findCity,
  openWeatherIconUrl,
} from "@/lib/weatherCities";
import { cn } from "@/lib/utils";

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

  const iconUrl = data?.icon
    ? openWeatherIconUrl(data.icon)
    : openWeatherIconUrl("03d");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center shrink-0 gap-0 select-none pointer-events-none",
        className
      )}
      title={name && data ? `${name}: ${data.temp}°` : t("weather")}
      aria-label={
        data ? `${name} ${data.temp}°` : isLoading ? t("weather") : t("weather")
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconUrl}
        alt=""
        width={40}
        height={40}
        className={cn(
          "w-10 h-10 object-contain -my-1",
          !data && "opacity-40 animate-pulse"
        )}
        draggable={false}
      />
      {data ? (
        <span className="text-[12px] font-bold tabular-nums leading-none text-foreground">
          {Math.round(data.temp)}°
        </span>
      ) : (
        <span className="text-[12px] font-medium text-muted leading-none">…</span>
      )}
    </div>
  );
}
