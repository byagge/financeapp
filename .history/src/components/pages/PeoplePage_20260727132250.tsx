"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { PersonReportSheet } from "@/components/shared/PersonReportSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePeople } from "@/hooks/useFinance";
import { formatBalance } from "@/lib/format";
import { fetchJson, type PersonItem } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <div className="space-y-5 pb-4 animate-fade-in">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary !min-h-[44px] !px-4 !text-[14px]"
          >
            <Plus className="w-4 h-4" />
            {t("add")}
          </button>
        }
      />

      {open && (
        <form
          className="card p-4 space-y-4 animate-fade-in"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <label className="block">
            <span className="field-label">{t("name")}</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="field"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setName("");
              }}
              className="btn-secondary"
            >
              {tCommon("cancel")}
            </button>
            <button type="submit" className="btn-primary">
              {t("save")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-[var(--muted)]">{tCommon("loading")}</div>
      ) : items.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="card divide-y divide-[var(--line)] overflow-hidden">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1">
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="flex flex-1 min-w-0 items-center gap-3 px-2 py-3 rounded-[var(--radius-sm)] text-left hover:bg-[var(--bg)] transition-colors min-h-[72px]"
              >
                <Avatar name={p.name} color={p.avatarColor} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{p.name}</div>
                  <div className="text-[13px] text-[var(--muted)]">
                    {t("income")}: {formatBalance(p.income, locale)} · {t("expense")}:{" "}
                    {formatBalance(p.expense, locale)}
                  </div>
                </div>
                <div
                  className={cn(
                    "font-bold text-[15px] tabular-nums shrink-0",
                    p.total >= 0 ? "text-income" : "text-expense"
                  )}
                >
                  {formatBalance(p.total, locale)}
                </div>
              </button>
              <button
                type="button"
                className="p-3 rounded-[var(--radius-sm)] hover:bg-expense-soft text-expense shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => {
                  if (confirm(tCommon("confirmDelete"))) remove.mutate(p.id);
                }}
                aria-label={t("delete")}
              >
                <Trash2 className="w-5 h-5" />
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
