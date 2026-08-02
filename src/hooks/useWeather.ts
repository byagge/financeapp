"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_WEATHER_CITY,
  WEATHER_CITY_KEY,
  normalizeWeatherCityId,
  type WeatherCityId,
} from "@/lib/weatherCities";

export type WeatherPayload = {
  temp: number;
  code: number;
  kind: "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
  isDay: boolean;
  icon: string;
  cityId: string;
  names: Record<string, string>;
};

const CITY_EVENT = "finance:weather-city";

function readStoredCity(): Exclude<WeatherCityId, "auto"> {
  if (typeof window === "undefined") return DEFAULT_WEATHER_CITY;
  try {
    return normalizeWeatherCityId(localStorage.getItem(WEATHER_CITY_KEY));
  } catch {
    return DEFAULT_WEATHER_CITY;
  }
}

export function useWeatherCity() {
  const [cityId, setCityIdState] =
    useState<Exclude<WeatherCityId, "auto">>(DEFAULT_WEATHER_CITY);
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
    const normalized = normalizeWeatherCityId(next);
    setCityIdState(normalized);
    try {
      localStorage.setItem(WEATHER_CITY_KEY, normalized);
      window.dispatchEvent(new Event(CITY_EVENT));
    } catch {
      /* ignore */
    }
  }, []);

  return { cityId, setCityId, ready };
}

export function useWeather(
  cityId: Exclude<WeatherCityId, "auto">,
  enabled = true
) {
  return useQuery({
    queryKey: ["weather", cityId],
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<WeatherPayload> => {
      const res = await fetch(
        `/api/weather?city=${encodeURIComponent(cityId)}`
      );
      if (!res.ok) throw new Error("weather");
      return res.json();
    },
  });
}
