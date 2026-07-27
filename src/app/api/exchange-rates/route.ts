import { NextResponse } from "next/server";
import { getExchangeRates, getRateToKgs } from "@/lib/exchange";
import { isValidCurrency } from "@/lib/currency";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get("currency")?.toUpperCase();
  const force = searchParams.get("refresh") === "1";

  try {
    if (currency) {
      if (!isValidCurrency(currency)) {
        return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
      }
      const rate = await getRateToKgs(currency);
      const all = await getExchangeRates(force);
      return NextResponse.json({
        currency,
        rate,
        date: all.date,
        source: all.source,
      });
    }

    const data = await getExchangeRates(force);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "FX unavailable" },
      { status: 502 }
    );
  }
}
