"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PersonItem } from "@/lib/types";

export type FilterState = {
  q: string;
  from: string;
  to: string;
  personId: string;
  type: string;
};

export function FiltersBar({
  value,
  onChange,
  people,
  compact,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  people: PersonItem[];
  compact?: boolean;
}) {
  const t = useTranslations("history");
  const tTx = useTranslations("transaction");

  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div
      className={`space-y-3 ${
        compact
          ? ""
          : "bg-white rounded-[24px] p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
      }`}
    >
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={value.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder={t("search")}
          className="w-full bg-[#F5F6FA] rounded-2xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4A3AFF]/20"
        />
        {value.q && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            onClick={() => set({ q: "" })}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <label className="text-xs text-[#9CA3AF] space-y-1">
          <span>{t("from")}</span>
          <input
            type="date"
            value={value.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-full bg-[#F5F6FA] rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="text-xs text-[#9CA3AF] space-y-1">
          <span>{t("to")}</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-full bg-[#F5F6FA] rounded-xl px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="text-xs text-[#9CA3AF] space-y-1">
          <span>{tTx("person")}</span>
          <select
            value={value.personId}
            onChange={(e) => set({ personId: e.target.value })}
            className="w-full bg-[#F5F6FA] rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            <option value="">{tTx("allTypes")}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#9CA3AF] space-y-1">
          <span>{tTx("type")}</span>
          <select
            value={value.type}
            onChange={(e) => set({ type: e.target.value })}
            className="w-full bg-[#F5F6FA] rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            <option value="">{tTx("allTypes")}</option>
            <option value="income">{tTx("income")}</option>
            <option value="expense">{tTx("expense")}</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({ q: "", from: "", to: "", personId: "", type: "" })
        }
        className="text-sm text-[#9CA3AF] hover:text-[#111827]"
      >
        {t("clear")}
      </button>
    </div>
  );
}
