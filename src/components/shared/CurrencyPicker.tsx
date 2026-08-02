"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { CurrencyFlag } from "@/components/shared/CurrencyFlag";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
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
  preferred,
  open: openProp,
  onOpenChange,
  children,
}: {
  value: string;
  rate: number | null;
  onChange: (code: string) => void;
  compact?: boolean;
  /** User wallet currencies — pinned at the top of the list. */
  preferred?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: (args: {
    selected: CurrencyInfo;
    open: () => void;
  }) => ReactNode;
}) {
  const t = useTranslations("currency");
  const locale = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? Boolean(openProp) : internalOpen;
  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [q, setQ] = useState("");
  const keyboardInset = useKeyboardInset(open);

  const selected = useMemo(() => {
    const list = searchCurrencies("", locale);
    return (
      list.find((c) => c.code === value) || {
        code: value,
        name: value,
        nameEn: value,
        nameRu: value,
        nameUz: value,
        symbol: value,
        digits: 2,
        primary: false,
      }
    );
  }, [value, locale]);

  const results = useMemo(() => searchCurrencies(q, locale), [q, locale]);

  const preferredCodes = useMemo(() => {
    const fromWallets = (preferred || []).map((c) => c.toUpperCase());
    const fallback = [...PRIMARY_CURRENCIES];
    const merged = [...fromWallets];
    for (const code of fallback) {
      if (!merged.includes(code)) merged.push(code);
    }
    return merged;
  }, [preferred]);

  const preferredSet = useMemo(
    () => new Set(preferredCodes),
    [preferredCodes]
  );

  const pinned = useMemo(
    () =>
      preferredCodes
        .map((code) => results.find((c) => c.code === code))
        .filter(Boolean) as CurrencyInfo[],
    [preferredCodes, results]
  );

  const others = useMemo(
    () => results.filter((c) => !preferredSet.has(c.code)),
    [results, preferredSet]
  );

  const listItems = useMemo(
    () => (q ? results : [...pinned, ...others]),
    [q, results, pinned, others]
  );

  function openSheet() {
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
    setQ("");
  }

  function pick(code: string) {
    onChange(code);
    closeSheet();
  }

  return (
    <div className="relative">
      {children ? (
        children({ selected, open: openSheet })
      ) : (
        <button
          type="button"
          onClick={openSheet}
          className={`w-full bg-card rounded-[16px] px-3 py-2.5 flex items-center justify-between gap-2 shadow-card text-left ${
            compact ? "" : ""
          }`}
        >
          <div className="min-w-0">
            <div className="text-[10px] text-muted">{t("label")}</div>
            <div className="font-semibold text-[13px] truncate">
              {selected.name}
            </div>
            <div className="text-[10px] text-muted-strong mt-0.5 truncate">
              {selected.code}
              {rate != null && value !== "KGS"
                ? ` · ${formatRate(rate, value)}`
                : value === "KGS"
                  ? ` · ${t("baseRate")}`
                  : ""}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted shrink-0" />
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/30"
            aria-label={t("close")}
            onClick={closeSheet}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card shadow-2xl flex flex-col animate-sheet pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            style={{
              bottom: keyboardInset,
              maxHeight: `min(92dvh, calc(100dvh - ${keyboardInset}px - 8px))`,
              height: `min(92dvh, calc(100dvh - ${keyboardInset}px - 8px))`,
            }}
          >
            <div className="px-4 pt-3 pb-2 border-b border-line">
              <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-3" />
              <div className="font-bold text-[16px] mb-3">{t("title")}</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search")}
                  className="w-full rounded-full bg-background pl-9 pr-4 py-2.5 text-[14px] outline-none"
                  inputMode="search"
                  enterKeyHint="search"
                />
              </div>
              {!q && pinned.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
                  {pinned.map((c) => {
                    const active = c.code === value;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => pick(c.code)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold border ${
                          active
                            ? "bg-primary-soft border-primary text-primary"
                            : "bg-card border-line-strong text-muted-strong"
                        }`}
                      >
                        {c.symbol || c.code}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {listItems.map((c, i) => {
                const active = c.code === value;
                const showDivider =
                  !q &&
                  pinned.length > 0 &&
                  i === pinned.length &&
                  others.length > 0;
                return (
                  <div key={c.code}>
                    {showDivider && (
                      <div className="mx-3 my-2 border-t border-line" />
                    )}
                    <button
                      type="button"
                      onClick={() => pick(c.code)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left ${
                        active ? "bg-primary-soft" : "active:bg-background"
                      }`}
                    >
                      <CurrencyFlag code={c.code} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] truncate">
                          {c.name}
                        </div>
                        <div className="text-[12px] text-muted truncate">
                          {c.code}
                          {c.symbol ? ` · ${c.symbol}` : ""}
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  </div>
                );
              })}
              {listItems.length === 0 && (
                <div className="text-center text-sm text-muted py-10">
                  {t("empty")}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
