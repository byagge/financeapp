"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { PersonReportSheet } from "@/components/shared/PersonReportSheet";
import { usePeople } from "@/hooks/useFinance";
import { formatBalance } from "@/lib/format";
import { fetchJson, type PersonItem } from "@/lib/types";

export function PeoplePage() {
  const t = useTranslations("people");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const qc = useQueryClient();
  const { data, isLoading } = usePeople();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PersonItem | null>(null);

  const create = useMutation({
    mutationFn: () =>
      fetchJson("/api/people", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      setName("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["people"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/people/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  const items = data?.items || [];

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between pt-1 gap-3">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">{t("title")}</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#4A3AFF] text-white rounded-full px-4 py-2 text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("add")}
        </button>
      </div>

      {open && (
        <form
          className="bg-card rounded-[22px] p-4 space-y-3 shadow-card animate-fade-in overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className="w-full min-w-0 bg-background rounded-xl px-4 py-3 outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setName("");
              }}
              className="rounded-xl px-4 py-3 font-semibold text-muted-strong bg-background"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              className="rounded-xl px-4 py-3 font-semibold text-white bg-[#4A3AFF]"
            >
              {t("save")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="bg-card rounded-[24px] p-8 text-center text-muted">…</div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-[24px] p-8 text-center text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-card rounded-[24px] divide-y divide-line overflow-hidden shadow-card">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1.5">
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="flex flex-1 min-w-0 items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-surface transition-colors"
              >
                <Avatar name={p.name} color={p.avatarColor} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted">
                    {t("income")}: {formatBalance(p.income, locale)} · {t("expense")}:{" "}
                    {formatBalance(p.expense, locale)}
                  </div>
                </div>
                <div
                  className={`font-semibold tabular-nums shrink-0 ${
                    p.total >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"
                  }`}
                >
                  {formatBalance(p.total, locale)}
                </div>
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-[#FEF2F2]/20 dark:hover:bg-[#7f1d1d]/30 text-[#EF4444] shrink-0"
                onClick={() => {
                  if (confirm(tCommon("confirmDelete"))) remove.mutate(p.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PersonReportSheet person={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
