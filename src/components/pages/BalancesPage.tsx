"use client";

import { ChevronLeft, Eye, EyeOff, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { PeriodPills } from "@/components/mobile/PeriodPills";
import { TransactionList } from "@/components/mobile/TransactionList";
import { AddCurrencySheet } from "@/components/shared/AddCurrencySheet";
import { CurrencyFlag } from "@/components/shared/CurrencyFlag";
import { FullScreenLoader } from "@/components/shared/FullScreenLoader";
import { TransactionSheet } from "@/components/shared/TransactionSheet";
import { useTransactions, useUserCurrencies } from "@/hooks/useFinance";
import { useHideBalance } from "@/hooks/useHideBalance";
import { groupBalancesByCurrency, type CurrencyBalance } from "@/lib/balances";
import {
  BASE_CURRENCY,
  currencySymbol,
  getCurrencyInfo,
} from "@/lib/currency";
import { formatBalance } from "@/lib/format";
import { defaultPeriodFilter, type PeriodFilter } from "@/lib/period";
import type { TxItem } from "@/lib/types";
import { buildRepeatQuery } from "@/lib/repeatTransaction";

function initialFilter(search: URLSearchParams): PeriodFilter {
  const from = search.get("from");
  const to = search.get("to");
  if (from && to) {
    const day = defaultPeriodFilter("day");
    const week = defaultPeriodFilter("week");
    if (from === day.from && to === day.to) return day;
    if (from === week.from && to === week.to) return week;
    return { key: "custom", from, to };
  }
  return defaultPeriodFilter("day");
}

export function BalancesPage() {
  const t = useTranslations("balances");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [period, setPeriod] = useState<PeriodFilter>(() => initialFilter(search));
  const { hidden, toggle } = useHideBalance();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<TxItem | null>(null);
  const [openCurrency, setOpenCurrency] = useState<string | null>(null);

  const { data, isLoading } = useTransactions({
    from: period.from,
    to: period.to,
  });
  const { data: walletsData, isLoading: walletsLoading } = useUserCurrencies();

  const items = data?.items || [];
  const summary = data?.summary || { income: 0, expense: 0, total: 0 };
  const walletCodes = useMemo(
    () => (walletsData?.items || []).map((w) => w.currency),
    [walletsData]
  );

  const currencies = useMemo(
    () => groupBalancesByCurrency(items, walletCodes),
    [items, walletCodes]
  );

  const activeCode = openCurrency || currencies[0]?.currency || null;

  const filtered = useMemo(() => {
    if (!activeCode) return [];
    return items.filter(
      (tx) => (tx.currency || "KGS").toUpperCase() === activeCode
    );
  }, [items, activeCode]);

  if ((isLoading && !data) || (walletsLoading && !walletsData)) {
    return <FullScreenLoader />;
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-1">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl bg-card border border-line-strong flex items-center justify-center shrink-0"
          aria-label={tCommon("back")}
        >
          <ChevronLeft className="w-6 h-6 text-foreground" strokeWidth={2} />
        </Link>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] flex-1">
          {t("title")}
        </h1>
      </header>

      {/* Total — big and clear */}
      <section className="bg-card rounded-[24px] px-5 py-5 shadow-card text-center">
        <div className="text-[16px] text-muted-strong font-medium">
          {t("totalBalance")}
        </div>
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className="text-[34px] font-bold tracking-[-0.03em] tabular-nums leading-none">
            {hidden
              ? `•••••• ${currencySymbol(BASE_CURRENCY)}`
              : formatBalance(summary.total, locale, BASE_CURRENCY)}
          </div>
          <button
            type="button"
            onClick={toggle}
            className="w-11 h-11 rounded-full bg-background flex items-center justify-center text-muted-strong shrink-0"
            aria-label={hidden ? tHome("show") : tHome("hide")}
          >
            {hidden ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="mt-2 text-[14px] text-muted">{t("inSoms")}</div>
      </section>

      <PeriodPills value={period} onChange={setPeriod} />

      {/* Currency list — one clear card per currency */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-bold px-0.5">{t("cards")}</h2>

        {currencies.length === 0 ? (
          <div className="bg-card rounded-[24px] py-12 text-center text-[16px] text-muted">
            {t("empty")}
          </div>
        ) : (
          currencies.map((c) => (
            <CurrencyRow
              key={c.currency}
              balance={c}
              hidden={hidden}
              locale={locale}
              selected={activeCode === c.currency}
              onSelect={() => setOpenCurrency(c.currency)}
              incomeLabel={tHome("income")}
              expenseLabel={tHome("expense")}
              balanceLabel={t("cardBalance")}
              inSomsLabel={t("approxSoms")}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[#D1D5DB] bg-card py-4 text-[16px] font-semibold text-primary active:bg-background"
        >
          <Plus className="w-5 h-5" strokeWidth={2.4} />
          {t("addTitle")}
        </button>
      </section>

      {activeCode && filtered.length > 0 && (
        <div className="lg:hidden">
          <TransactionList
            items={filtered.slice(0, 6)}
            title={t("currencyOps")}
            onSelect={setSelected}
          />
        </div>
      )}

      <AddCurrencySheet
        open={addOpen}
        existing={walletCodes}
        onClose={() => setAddOpen(false)}
        onAdded={(currency) => setOpenCurrency(currency)}
      />

      {selected && (
        <TransactionSheet
          tx={selected}
          onClose={() => setSelected(null)}
          onEdit={() => router.push(`/transactions/${selected.id}`)}
          onRepeat={() => {
            const qs = buildRepeatQuery(selected);
            setSelected(null);
            router.push(`/transactions/new?${qs}`);
          }}
        />
      )}
    </div>
  );
}

function CurrencyRow({
  balance,
  hidden,
  locale,
  selected,
  onSelect,
  incomeLabel,
  expenseLabel,
  balanceLabel,
  inSomsLabel,
}: {
  balance: CurrencyBalance;
  hidden: boolean;
  locale: string;
  selected: boolean;
  onSelect: () => void;
  incomeLabel: string;
  expenseLabel: string;
  balanceLabel: string;
  inSomsLabel: string;
}) {
  const info = getCurrencyInfo(balance.currency, locale);
  const name = info?.name || balance.currency;
  const symbol = currencySymbol(balance.currency);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left bg-card rounded-[24px] px-4 py-4 shadow-card transition-shadow ${
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      <div className="flex items-center gap-3.5">
        <CurrencyFlag code={balance.currency} size={56} />
        <div className="flex-1 min-w-0">
          <div className="text-[20px] font-bold truncate leading-tight">
            {name}
          </div>
          <div className="text-[15px] text-muted-strong mt-0.5 font-medium">
            {balance.currency} · {symbol}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <div className="text-[14px] text-muted-strong font-medium">{balanceLabel}</div>
        <div className="mt-1 text-[28px] font-bold tracking-[-0.03em] tabular-nums leading-none">
          {hidden
            ? `•••• ${symbol}`
            : formatBalance(balance.total, locale, balance.currency)}
        </div>
        {balance.currency !== BASE_CURRENCY && (
          <div className="mt-1.5 text-[14px] text-muted">
            {inSomsLabel}:{" "}
            {hidden
              ? "•••"
              : formatBalance(balance.totalKgs, locale, BASE_CURRENCY)}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-success-soft px-3.5 py-3.5">
          <div className="text-[14px] font-medium text-success-strong">
            {incomeLabel}
          </div>
          <div className="mt-1.5 text-[18px] font-bold tabular-nums text-success-strong leading-snug">
            {hidden
              ? "•••"
              : formatBalance(balance.income, locale, balance.currency)}
          </div>
        </div>
        <div className="rounded-2xl bg-danger-soft px-3.5 py-3.5">
          <div className="text-[14px] font-medium text-danger-strong">
            {expenseLabel}
          </div>
          <div className="mt-1.5 text-[18px] font-bold tabular-nums text-danger-strong leading-snug">
            {hidden
              ? "•••"
              : formatBalance(balance.expense, locale, balance.currency)}
          </div>
        </div>
      </div>
    </button>
  );
}
