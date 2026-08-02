"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  WEATHER_CITY_KEY,
  type WeatherCityId,
} from "@/lib/weatherCities";

export type WeatherPayload = {
  temp: number;
  code: number;
  kind: "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
  cityId: string;
  names: Record<string, string>;
};

const CITY_EVENT = "finance:weather-city";

function readStoredCity(): WeatherCityId {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = localStorage.getItem(WEATHER_CITY_KEY);
    if (raw === "auto" || !raw) return "auto";
    return raw as WeatherCityId;
  } catch {
    return "auto";
  }
}

export function useWeatherCity() {
  const [cityId, setCityIdState] = useState<WeatherCityId>("auto");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCityIdState(readStoredCity());
    setReady(true);
    function sync() {
      setCityIdState(readStoredCity());
    }
    window.addEventListener(CITY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CITY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setCityId = useCallback((next: WeatherCityId) => {
    setCityIdState(next);
    try {
      localStorage.setItem(WEATHER_CITY_KEY, next);
      window.dispatchEvent(new Event(CITY_EVENT));
    } catch {
      /* ignore */
    }
  }, []);

  return { cityId, setCityId, ready };
}

export function useWeather(cityId: WeatherCityId, enabled = true) {
  return useQuery({
    queryKey: ["weather", cityId],
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<WeatherPayload> => {
      const qs =
        cityId && cityId !== "auto"
          ? `?city=${encodeURIComponent(cityId)}`
          : "";
      const res = await fetch(`/api/weather${qs}`);
      if (!res.ok) throw new Error("weather");
      return res.json();
    },
  });
}
