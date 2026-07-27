"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  PRIMARY_CURRENCIES,
  searchCurrencies,
  type CurrencyInfo,
} from "@/lib/currency";
import { formatRate } from "@/lib/format";

export function CurrencyPicker({
  value,
  rate,
  onChange,
  compact,
}: {
  value: string;
  rate: number | null;
  onChange: (code: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations("currency");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(() => {
    const list = searchCurrencies("", locale);
    return list.find((c) => c.code === value) || {
      code: value,
      name: value,
      nameEn: value,
      symbol: value,
      digits: 2,
      primary: false,
    };
  }, [value, locale]);

  const results = useMemo(() => searchCurrencies(q, locale), [q, locale]);
  const primary = useMemo(
    () =>
      PRIMARY_CURRENCIES.map((code) =>
        results.find((c) => c.code === code)
      ).filter(Boolean) as CurrencyInfo[],
    [results]
  );
  const others = useMemo(
    () => results.filter((c) => !(PRIMARY_CURRENCIES as readonly string[]).includes(c.code)),
    [results]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full bg-white rounded-[16px] px-3 py-2.5 flex items-center justify-between gap-2 shadow-[0_4px_14px_rgba(17,24,39,0.04)] text-left ${
          compact ? "" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="text-[10px] text-[#9CA3AF]">{t("label")}</div>
          <div className="font-semibold text-[13px] truncate">
            {selected.code} · {selected.symbol}
          </div>
          {rate != null && value !== "KGS" && (
            <div className="text-[10px] text-[#6B7280] mt-0.5 truncate">
              {formatRate(rate, value)}
            </div>
          )}
          {value === "KGS" && (
            <div className="text-[10px] text-[#6B7280] mt-0.5">{t("baseRate")}</div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-[24px] bg-white shadow-2xl max-h-[75dvh] flex flex-col animate-sheet">
            <div className="px-4 pt-3 pb-2 border-b border-[#EEF0F5]">
              <div className="mx-auto w-10 h-1 rounded-full bg-[#E5E7EB] mb-3" />
              <div className="font-bold text-[16px] mb-3">{t("title")}</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search")}
                  className="w-full rounded-full bg-[#F5F6FA] pl-9 pr-4 py-2.5 text-[14px] outline-none"
                  autoFocus
                />
              </div>
              {!q && (
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
                  {primary.map((c) => {
                    const active = c.code === value;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          onChange(c.code);
                          setOpen(false);
                          setQ("");
                        }}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold border ${
                          active
                            ? "bg-[#EEECFF] border-[#4A3AFF] text-[#4A3AFF]"
                            : "bg-white border-[#E5E7EB] text-[#374151]"
                        }`}
                      >
                        {c.code}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {(q ? results : others).map((c) => {
                const active = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQ("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left ${
                      active ? "bg-[#EEECFF]" : "active:bg-[#F5F6FA]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5F6FA] flex items-center justify-center text-[11px] font-bold text-[#4A3AFF]">
                      {c.symbol.length <= 2 ? c.symbol : c.code.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[14px]">{c.code}</div>
                      <div className="text-[12px] text-[#9CA3AF] truncate">{c.name}</div>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#4A3AFF]" />}
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="text-center text-sm text-[#9CA3AF] py-10">{t("empty")}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
