"use client";

import { Plus, Shield, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchJson } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  createdAt: string;
};

export function AdminPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchJson<{ items: AdminUser[] }>("/api/admin/users"),
    enabled: session?.user?.role === "admin",
  });

  const create = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      setError("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      setError(err.message === "exists" ? tAuth("exists") : tCommon("error"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (status === "loading" || session?.user?.role !== "admin") {
    return (
      <div className="py-16 text-center text-[var(--muted)]">{tCommon("loading")}</div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="space-y-5 max-w-2xl pb-4 animate-fade-in">
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
            {t("create")}
          </button>
        }
      />

      {open && (
        <form
          className="card p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            create.mutate();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tAuth("name")}
            required
            className="field"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tAuth("email")}
            required
            className="field"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tAuth("password")}
            required
            minLength={6}
            className="field"
          />
          {error && <p className="text-[14px] text-expense">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="btn-secondary"
            >
              {tCommon("cancel")}
            </button>
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? "…" : t("save")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-[var(--muted)]">…</div>
      ) : items.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <div className="card divide-y divide-[var(--line)] overflow-hidden">
          {items.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-4 min-h-[72px]">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] truncate">{u.name}</div>
                <div className="text-[13px] text-[var(--muted)] truncate">{u.email}</div>
              </div>
              <span
                className={cn(
                  "text-[12px] font-semibold rounded-full px-3 py-1 shrink-0",
                  u.role === "admin"
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "bg-[var(--bg)] text-[var(--muted)]"
                )}
              >
                {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
              </span>
              {u.id !== session.user.id && (
                <button
                  type="button"
                  className="p-3 rounded-[var(--radius-sm)] hover:bg-expense-soft text-expense shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={() => {
                    if (confirm(t("confirmDelete"))) remove.mutate(u.id);
                  }}
                  aria-label={tCommon("confirmDelete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
