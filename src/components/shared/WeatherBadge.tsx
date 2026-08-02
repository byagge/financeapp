"use client";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from "lucide-react";
import { useLocale } from "next-intl";
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
  const cls = cn("w-5 h-5", className);
  switch (kind) {
    case "clear":
      return <Sun className={cls} strokeWidth={1.8} />;
    case "rain":
      return <CloudRain className={cls} strokeWidth={1.8} />;
    case "snow":
      return <CloudSnow className={cls} strokeWidth={1.8} />;
    case "storm":
      return <CloudLightning className={cls} strokeWidth={1.8} />;
    case "fog":
      return <CloudFog className={cls} strokeWidth={1.8} />;
    default:
      return <Cloud className={cls} strokeWidth={1.8} />;
  }
}

export function WeatherBadge({ className }: { className?: string }) {
  const locale = useLocale();
  const { cityId, ready } = useWeatherCity();
  const { data, isLoading } = useWeather(cityId, ready);

  const name = data
    ? data.names[locale] ||
      data.names.ru ||
      findCity(data.cityId)?.names.ru ||
      ""
    : "";

  return (
    <div
      className={cn(
        "min-w-[3.25rem] h-12 px-2 rounded-xl bg-card border border-line-strong flex flex-col items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(17,24,39,0.04)]",
        className
      )}
      title={name || undefined}
      aria-label={
        data ? `${name} ${data.temp}°` : isLoading ? "…" : "—"
      }
    >
      {data ? (
        <>
          <WeatherIcon
            kind={data.kind}
            className="text-muted-strong w-[18px] h-[18px]"
          />
          <span className="text-[12px] font-semibold tabular-nums leading-none mt-0.5 text-foreground">
            {data.temp}°
          </span>
        </>
      ) : (
        <span className="text-[12px] text-muted">…</span>
      )}
    </div>
  );
}
