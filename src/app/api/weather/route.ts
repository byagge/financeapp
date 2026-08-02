import { NextRequest, NextResponse } from "next/server";
import {
  findCity,
  nearestCity,
  weatherKind,
  type WeatherCityId,
} from "@/lib/weatherCities";

export const dynamic = "force-dynamic";

type OpenMeteoCurrent = {
  temperature_2m: number;
  weather_code: number;
};

async function fetchWeather(lat: number, lon: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");
  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error("weather_upstream");
  const data = (await res.json()) as { current?: OpenMeteoCurrent };
  if (!data.current) throw new Error("weather_empty");
  return data.current;
}

function clientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

async function locateByIp(req: NextRequest) {
  const ip = clientIp(req);
  // Skip private/local IPs — fall back to Bishkek region default
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip === "::1"
  ) {
    return findCity("bishkek")!;
  }

  try {
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return findCity("bishkek")!;
    const data = (await res.json()) as {
      error?: boolean;
      latitude?: number;
      longitude?: number;
      lat?: number;
      lon?: number;
    };
    if (data.error) return findCity("bishkek")!;
    const lat = data.latitude ?? data.lat;
    const lon = data.longitude ?? data.lon;
    if (lat == null || lon == null) return findCity("bishkek")!;
    return nearestCity(lat, lon);
  } catch {
    return findCity("bishkek")!;
  }
}

export async function GET(req: NextRequest) {
  try {
    const cityParam = req.nextUrl.searchParams.get("city") as WeatherCityId | null;
    let city =
      cityParam && cityParam !== "auto" ? findCity(cityParam) : null;

    if (!city) {
      city = await locateByIp(req);
    }

    const current = await fetchWeather(city.lat, city.lon);
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const kind = weatherKind(code);

    return NextResponse.json({
      temp,
      code,
      kind,
      cityId: city.id,
      names: city.names,
      lat: city.lat,
      lon: city.lon,
    });
  } catch {
    return NextResponse.json({ error: "weather_failed" }, { status: 502 });
  }
}
