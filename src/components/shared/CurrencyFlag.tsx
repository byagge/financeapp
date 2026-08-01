"use client";

import { useMemo, useState } from "react";
import { currencyFlagCountry, currencyFlagPngUrl, currencyFlagUrl } from "@/lib/currencyFlags";
import { currencySymbol } from "@/lib/currency";

/** Fill color behind flag so circular crop never shows a white/gray halo. */
const FLAG_BG: Record<string, string> = {
  eu: "#003399",
  us: "#B22234",
  gb: "#012169",
  kg: "#E8112D",
  uz: "#1EB53A",
  ru: "#0039A6",
  jp: "#FFFFFF",
  cn: "#DE2910",
  kz: "#00AFCA",
  tr: "#E30A17",
  ch: "#FF0000",
  au: "#00008B",
  ca: "#FF0000",
  in: "#FF9933",
  ae: "#00732F",
};

export function CurrencyFlag({
  code,
  size = 44,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const [usePng, setUsePng] = useState(false);
  const [failed, setFailed] = useState(false);
  const country = useMemo(() => currencyFlagCountry(code), [code]);
  const svg = useMemo(() => currencyFlagUrl(code), [code]);
  const png = useMemo(() => currencyFlagPngUrl(code, 320), [code]);
  const src = (!usePng && svg) || png;
  const symbol = currencySymbol(code);
  const bg = (country && FLAG_BG[country]) || "#1F2937";

  if (!src || failed) {
    return (
      <div
        className={`rounded-full bg-primary-soft text-[#4A3AFF] flex items-center justify-center font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.28 }}
        aria-hidden
      >
        {symbol.length <= 2 ? symbol : code.slice(0, 2)}
      </div>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: bg }}
      aria-hidden
    >
      <img
        key={src}
        src={src}
        alt=""
        width={size * 2}
        height={size * 2}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!usePng && png && src !== png) {
            setUsePng(true);
            return;
          }
          setFailed(true);
        }}
        className={`absolute inset-0 h-full w-full max-w-none ${
          country === "eu" ? "object-contain" : "object-cover"
        }`}
      />
    </span>
  );
}
