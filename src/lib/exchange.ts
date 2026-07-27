import { BASE_CURRENCY } from "@/lib/currency";

export type RatesPayload = {
  base: typeof BASE_CURRENCY;
  date: string;
  /** KGS per 1 unit of each currency (курс к сому) */
  rates: Record<string, number>;
  source: string;
};

type Cache = { at: number; data: RatesPayload };

const globalRates = globalThis as unknown as { __fxCache?: Cache };
const TTL_MS = 60 * 60 * 1000; // 1 hour

function invertOpenErRates(raw: Record<string, number>): Record<string, number> {
  const rates: Record<string, number> = { [BASE_CURRENCY]: 1 };
  for (const [code, perKgs] of Object.entries(raw)) {
    if (!Number.isFinite(perKgs) || perKgs === 0) continue;
    // open.er-api: value = units of `code` per 1 KGS → invert to KGS per 1 code
    rates[code] = code === BASE_CURRENCY ? 1 : 1 / perKgs;
  }
  return rates;
}

async function fetchOpenErApi(): Promise<RatesPayload> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const json = (await res.json()) as {
    result?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };
  if (json.result !== "success" || !json.rates) {
    throw new Error("FX bad payload");
  }
  return {
    base: BASE_CURRENCY,
    date: (json.time_last_update_utc || new Date().toISOString()).slice(0, 10),
    rates: invertOpenErRates(json.rates),
    source: "open.er-api.com",
  };
}

async function fetchFrankfurterNbkr(): Promise<RatesPayload> {
  const res = await fetch(
    `https://api.frankfurter.dev/v2/rates?base=${BASE_CURRENCY}&providers=NBKR`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const rows = (await res.json()) as {
    date?: string;
    base?: string;
    quote?: string;
    rate?: number;
  }[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Frankfurter empty");

  const rates: Record<string, number> = { [BASE_CURRENCY]: 1 };
  let date = new Date().toISOString().slice(0, 10);
  for (const row of rows) {
    if (!row.quote || row.rate == null || !Number.isFinite(row.rate) || row.rate === 0) {
      continue;
    }
    if (row.date) date = row.date;
    rates[row.quote] = row.quote === BASE_CURRENCY ? 1 : 1 / row.rate;
  }
  return {
    base: BASE_CURRENCY,
    date,
    rates,
    source: "frankfurter/NBKR",
  };
}

export async function getExchangeRates(force = false): Promise<RatesPayload> {
  const cached = globalRates.__fxCache;
  if (!force && cached && Date.now() - cached.at < TTL_MS) {
    return cached.data;
  }

  let data: RatesPayload;
  try {
    data = await fetchOpenErApi();
  } catch {
    data = await fetchFrankfurterNbkr();
  }

  globalRates.__fxCache = { at: Date.now(), data };
  return data;
}

export async function getRateToKgs(currency: string): Promise<number> {
  const code = currency.toUpperCase();
  if (code === BASE_CURRENCY) return 1;
  const { rates } = await getExchangeRates();
  const rate = rates[code];
  if (!rate || !Number.isFinite(rate)) {
    throw new Error(`No rate for ${code}`);
  }
  return rate;
}
