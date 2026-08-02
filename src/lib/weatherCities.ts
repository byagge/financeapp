export type WeatherCityId =
  | "auto"
  | "bishkek"
  | "osh"
  | "jalalabad"
  | "karakol"
  | "tashkent"
  | "andijan"
  | "namangan"
  | "fergana"
  | "samarkand"
  | "bukhara"
  | "almaty"
  | "shymkent";

export type WeatherCity = {
  id: Exclude<WeatherCityId, "auto">;
  lat: number;
  lon: number;
  names: Record<string, string>;
};

/** Common cities for the region — manual pick is more accurate than IP. */
export const WEATHER_CITIES: WeatherCity[] = [
  {
    id: "bishkek",
    lat: 42.8746,
    lon: 74.5698,
    names: { ru: "Бишкек", en: "Bishkek", uz: "Бишкек", "uz-Latn": "Bishkek", ky: "Бишкек" },
  },
  {
    id: "osh",
    lat: 40.5283,
    lon: 72.7985,
    names: { ru: "Ош", en: "Osh", uz: "Ош", "uz-Latn": "Osh", ky: "Ош" },
  },
  {
    id: "jalalabad",
    lat: 40.9333,
    lon: 73.0,
    names: {
      ru: "Джалал-Абад",
      en: "Jalal-Abad",
      uz: "Жалолобод",
      "uz-Latn": "Jalolobod",
      ky: "Жалал-Абад",
    },
  },
  {
    id: "karakol",
    lat: 42.4907,
    lon: 78.3936,
    names: {
      ru: "Каракол",
      en: "Karakol",
      uz: "Қоракўл",
      "uz-Latn": "Qoraqoʻl",
      ky: "Каракол",
    },
  },
  {
    id: "tashkent",
    lat: 41.2995,
    lon: 69.2401,
    names: {
      ru: "Ташкент",
      en: "Tashkent",
      uz: "Тошкент",
      "uz-Latn": "Toshkent",
      ky: "Ташкент",
    },
  },
  {
    id: "andijan",
    lat: 40.7821,
    lon: 72.3442,
    names: {
      ru: "Андижан",
      en: "Andijan",
      uz: "Андижон",
      "uz-Latn": "Andijon",
      ky: "Андижан",
    },
  },
  {
    id: "namangan",
    lat: 40.9983,
    lon: 71.6726,
    names: {
      ru: "Наманган",
      en: "Namangan",
      uz: "Наманган",
      "uz-Latn": "Namangan",
      ky: "Наманган",
    },
  },
  {
    id: "fergana",
    lat: 40.3864,
    lon: 71.7864,
    names: {
      ru: "Фергана",
      en: "Fergana",
      uz: "Фарғона",
      "uz-Latn": "Fargʻona",
      ky: "Фергана",
    },
  },
  {
    id: "samarkand",
    lat: 39.627,
    lon: 66.975,
    names: {
      ru: "Самарканд",
      en: "Samarkand",
      uz: "Самарқанд",
      "uz-Latn": "Samarqand",
      ky: "Самарканд",
    },
  },
  {
    id: "bukhara",
    lat: 39.7681,
    lon: 64.4556,
    names: {
      ru: "Бухара",
      en: "Bukhara",
      uz: "Бухоро",
      "uz-Latn": "Buxoro",
      ky: "Бухара",
    },
  },
  {
    id: "almaty",
    lat: 43.222,
    lon: 76.8512,
    names: {
      ru: "Алматы",
      en: "Almaty",
      uz: "Олмаота",
      "uz-Latn": "Olmaota",
      ky: "Алматы",
    },
  },
  {
    id: "shymkent",
    lat: 42.3419,
    lon: 69.5901,
    names: {
      ru: "Шымкент",
      en: "Shymkent",
      uz: "Чимкент",
      "uz-Latn": "Chimkent",
      ky: "Шымкент",
    },
  },
];

export function cityLabel(city: WeatherCity, locale: string) {
  return city.names[locale] || city.names.ru || city.id;
}

export function findCity(id: string) {
  return WEATHER_CITIES.find((c) => c.id === id) || null;
}

/** Nearest preset city to lat/lon (for IP/geo mapping). */
export function nearestCity(lat: number, lon: number) {
  let best = WEATHER_CITIES[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of WEATHER_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export type WeatherKind =
  | "clear"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

export function weatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

/** OpenWeather icon id (01d / 01n …) from WMO weather code. */
export function openWeatherIcon(code: number, isDay: boolean): string {
  const d = isDay ? "d" : "n";
  if (code === 0) return `01${d}`;
  if (code === 1) return `02${d}`;
  if (code === 2) return `03${d}`;
  if (code === 3) return `04${d}`;
  if (code === 45 || code === 48) return `50${d}`;
  if ((code >= 51 && code <= 57) || code === 80) return `09${d}`;
  if ((code >= 61 && code <= 67) || code === 81 || code === 82) return `10${d}`;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return `13${d}`;
  if (code >= 95) return `11${d}`;
  return `03${d}`;
}

export function openWeatherIconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export const WEATHER_CITY_KEY = "finance.weatherCity";
export const DEFAULT_WEATHER_CITY: Exclude<WeatherCityId, "auto"> = "bishkek";

export function normalizeWeatherCityId(raw: string | null | undefined): Exclude<WeatherCityId, "auto"> {
  if (!raw || raw === "auto") return DEFAULT_WEATHER_CITY;
  if (findCity(raw as WeatherCityId)) return raw as Exclude<WeatherCityId, "auto">;
  return DEFAULT_WEATHER_CITY;
}